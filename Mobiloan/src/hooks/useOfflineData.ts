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

export const useLoans = () =>
  useQuery({
    queryKey: ['loans'],
    queryFn: () => localDb.listLoans(),
  });

export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => localDb.getDashboardStats(),
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

export const usePaymentAlerts = (limit = 6) =>
  useQuery({
    queryKey: ['payment-alerts', limit],
    queryFn: () => localDb.listPaymentAlerts(limit),
  });

export const useRecentActivity = (limit = 5) =>
  useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: () => localDb.listRecentActivity(limit),
  });

export const useCollectionProjections = (months = 6) =>
  useQuery({
    queryKey: ['collection-projections', months],
    queryFn: () => localDb.getCollectionProjections(months),
  });

export const useAllClients = () =>
  useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => localDb.listClients(''),
  });
