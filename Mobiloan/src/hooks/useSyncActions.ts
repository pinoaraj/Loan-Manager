import { useMutation, useQueryClient } from '@tanstack/react-query';

import { localDb } from '../data/database';
import { syncService } from '../services/sync';
import { useSession } from '../providers/AppProviders';
import type {
  LocalClientDraft,
  LocalLoanDraft,
  PaymentTransactionMutationPayload,
} from '../types/sync';

const invalidateAll = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['sync-snapshot'] }),
    queryClient.invalidateQueries({ queryKey: ['clients'] }),
    queryClient.invalidateQueries({ queryKey: ['client-detail'] }),
    queryClient.invalidateQueries({ queryKey: ['loan-detail'] }),
    queryClient.invalidateQueries({ queryKey: ['collection-queue'] }),
    queryClient.invalidateQueries({ queryKey: ['pending-outbox'] }),
    queryClient.invalidateQueries({ queryKey: ['rejected-outbox'] }),
  ]);
};

export const useManualSync = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();

  return useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error('No active session');
      }

      return syncService.syncAll(session);
    },
    onSuccess: async () => {
      await invalidateAll(queryClient);
    },
  });
};

export const useQueuePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PaymentTransactionMutationPayload) => {
      return syncService.enqueuePaymentTransaction(payload);
    },
    onSuccess: async () => {
      await invalidateAll(queryClient);
    },
  });
};

export const useRetryRejectedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutationId: string) => {
      await syncService.retryRejectedMutation(mutationId);
    },
    onSuccess: async () => {
      await invalidateAll(queryClient);
      await queryClient.invalidateQueries({ queryKey: ['rejected-outbox'] });
    },
  });
};

export const useDiscardRejectedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mutationId: string) => {
      await syncService.discardRejectedMutation(mutationId);
    },
    onSuccess: async () => {
      await invalidateAll(queryClient);
      await queryClient.invalidateQueries({ queryKey: ['rejected-outbox'] });
    },
  });
};

export const useCreateLocalClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LocalClientDraft) => localDb.createLocalClient(payload),
    onSuccess: async () => {
      await invalidateAll(queryClient);
    },
  });
};

export const useCreateLocalLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LocalLoanDraft) => localDb.createLocalLoan(payload),
    onSuccess: async () => {
      await invalidateAll(queryClient);
    },
  });
};
