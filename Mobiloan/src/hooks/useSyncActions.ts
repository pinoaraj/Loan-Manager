import { useMutation, useQueryClient } from '@tanstack/react-query';

import { localDb } from '../data/database';
import { syncService } from '../services/sync';
import { useSession } from '../providers/AppProviders';
import type {
  LocalClientDraft,
  LocalLoanDraft,
  PaymentTransactionMutationPayload,
  PortableSyncPackage,
} from '../types/sync';

const invalidateAll = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['sync-snapshot'] }),
    queryClient.invalidateQueries({ queryKey: ['clients'] }),
    queryClient.invalidateQueries({ queryKey: ['client-detail'] }),
    queryClient.invalidateQueries({ queryKey: ['loan-detail'] }),
    queryClient.invalidateQueries({ queryKey: ['loans'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
    queryClient.invalidateQueries({ queryKey: ['collection-queue'] }),
    queryClient.invalidateQueries({ queryKey: ['payment-alerts'] }),
    queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
    queryClient.invalidateQueries({ queryKey: ['collection-projections'] }),
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

export const useUpdateLocalClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, draft }: { clientId: string; draft: LocalClientDraft }) =>
      localDb.updateLocalClient(clientId, draft),
    onSuccess: async () => {
      await invalidateAll(queryClient);
    },
  });
};

export const useDeleteLocalClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => localDb.deleteLocalClient(clientId),
    onSuccess: async () => {
      await invalidateAll(queryClient);
    },
  });
};

export const useSetLoanPaused = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ loanId, paused }: { loanId: string; paused: boolean }) =>
      localDb.setLoanPaused(loanId, paused),
    onSuccess: async () => {
      await invalidateAll(queryClient);
    },
  });
};

export const useDeleteLocalLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanId: string) => localDb.deleteLocalLoan(loanId),
    onSuccess: async () => {
      await invalidateAll(queryClient);
    },
  });
};

export const useRecalculateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanId: string) => localDb.recalculateLoanSchedule(loanId),
    onSuccess: async () => {
      await invalidateAll(queryClient);
    },
  });
};

export const useImportPortableSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PortableSyncPackage) => localDb.importPortableSnapshot(payload),
    onSuccess: async () => {
      await invalidateAll(queryClient);
    },
  });
};
