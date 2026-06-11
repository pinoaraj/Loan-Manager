import { useQuery } from '@tanstack/react-query';

import { localDb } from '../data/database';
import type { CollectionFilter } from '../types/sync';

export const useSyncSnapshot = () =>
  useQuery({
    queryKey: ['sync-snapshot'],
    queryFn: () => localDb.getSnapshot(),
  });

export const useClients = (search = '') =>
  useQuery({
    queryKey: ['clients', search],
    queryFn: () => localDb.listClients(search),
  });

export const useClientDetail = (clientId: string) =>
  useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: () => localDb.getClientDetail(clientId),
    enabled: Boolean(clientId),
  });

export const useLoanDetail = (loanId: string) =>
  useQuery({
    queryKey: ['loan-detail', loanId],
    queryFn: () => localDb.getLoanDetail(loanId),
    enabled: Boolean(loanId),
  });

export const useRejectedOutbox = () =>
  useQuery({
    queryKey: ['rejected-outbox'],
    queryFn: () => localDb.listRejectedOutbox(),
  });

export const usePendingOutbox = () =>
  useQuery({
    queryKey: ['pending-outbox'],
    queryFn: () => localDb.listPendingOutboxDetailed(),
  });

export const useCollectionQueue = (filter: CollectionFilter) =>
  useQuery({
    queryKey: ['collection-queue', filter],
    queryFn: () => localDb.listCollectionQueue(filter),
  });
