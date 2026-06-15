import * as Network from 'expo-network';

import { localDb } from '../data/database';
import { createClientMutationId } from '../lib/mutationId';
import { mobileApi } from './api';
import type {
  OutboxMutationRecord,
  PaymentTransactionMutationPayload,
  SessionRecord,
  SyncMutation,
  SyncPushResult,
} from '../types/sync';

const normalizeTransaction = (
  mutationId: string,
  payload: PaymentTransactionMutationPayload,
): OutboxMutationRecord => {
  const now = new Date().toISOString();
  return {
    id: mutationId,
    entity: 'paymentTransaction',
    operation: 'create',
    payload,
    status: 'pending',
    errorCode: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
};

let activeSyncPromise: Promise<SyncPushResult[]> | null = null;

const applyPushResults = async (results: SyncPushResult[]) => {
  for (const result of results) {
    if (result.status === 'applied') {
      await localDb.markOutboxApplied(result.clientMutationId);
    } else {
      await localDb.markOutboxRejected(
        result.clientMutationId,
        result.errorCode ?? null,
        result.message ?? null,
      );
      await localDb.revertOptimisticPaymentTransaction(result.clientMutationId);
    }
  }
};

export const syncService = {
  async initialize(): Promise<void> {
    await localDb.init();
  },

  async isOnline(): Promise<boolean> {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  },

  async bootstrap(session: SessionRecord): Promise<void> {
    const payload = await mobileApi.fetchBootstrap(session.token);
    await localDb.resetSnapshot();
    await localDb.upsertClients(payload.clients);
    await localDb.upsertLoans(payload.loans);
    await localDb.upsertPayments(payload.payments);
    await localDb.upsertPaymentTransactions(payload.paymentTransactions);
    await localDb.setMeta('serverCursor', payload.serverCursor);
    await localDb.setMeta('lastSyncAt', new Date().toISOString());
  },

  async pullChanges(session: SessionRecord): Promise<boolean> {
    const cursor = await localDb.getMeta('serverCursor');
    if (!cursor) {
      await this.bootstrap(session);
      return true;
    }

    const payload = await mobileApi.fetchChanges(session.token, cursor);
    await localDb.applyDeletedIds(payload.deletedIds);
    await localDb.upsertClients(payload.changes.clients);
    await localDb.upsertLoans(payload.changes.loans);
    await localDb.upsertPayments(payload.changes.payments);
    await localDb.upsertPaymentTransactions(payload.changes.paymentTransactions);
    await localDb.setMeta('serverCursor', payload.serverCursor);
    await localDb.setMeta('lastSyncAt', new Date().toISOString());
    return true;
  },

  async enqueuePaymentTransaction(payload: PaymentTransactionMutationPayload): Promise<string> {
    const clientMutationId = createClientMutationId();
    await localDb.addOutboxMutation(normalizeTransaction(clientMutationId, payload));

    try {
      await localDb.applyOptimisticPaymentTransaction(clientMutationId, payload);
    } catch (error) {
      await localDb.deleteOutboxMutation(clientMutationId);
      throw error;
    }

    return clientMutationId;
  },

  async retryRejectedMutation(mutationId: string): Promise<void> {
    await localDb.retryOutboxMutation(mutationId);
  },

  async discardRejectedMutation(mutationId: string): Promise<void> {
    await localDb.deleteOutboxMutation(mutationId);
  },

  async flushOutbox(session: SessionRecord): Promise<SyncPushResult[]> {
    const pending = await localDb.listPendingOutbox();
    if (pending.length === 0) {
      return [];
    }

    const mutations: SyncMutation[] = pending.map((item) => ({
      clientMutationId: item.id,
      entity: item.entity,
      operation: item.operation,
      payload: item.payload,
    }));

    const payload = await mobileApi.pushMutations(session.token, mutations);
    await applyPushResults(payload.results);
    await localDb.setMeta('serverCursor', payload.serverCursor);
    await localDb.setMeta('lastSyncAt', new Date().toISOString());
    return payload.results;
  },

  async syncAll(session: SessionRecord): Promise<SyncPushResult[]> {
    if (session.mode === 'local') {
      return [];
    }

    if (activeSyncPromise) {
      return activeSyncPromise;
    }

    activeSyncPromise = (async () => {
      const online = await this.isOnline();
      if (!online) {
        return [];
      }

      const pushResults = await this.flushOutbox(session);
      await this.pullChanges(session);
      return pushResults;
    })();

    try {
      return await activeSyncPromise;
    } finally {
      activeSyncPromise = null;
    }
  },
};
