import type {
  ClientRecord,
  CollectionFilter,
  CollectionQueueItem,
  LocalClientDraft,
  LocalLoanDraft,
  LoanRecord,
  OutboxMutationRecord,
  PendingOutboxItem,
  PaymentRecord,
  PaymentTransactionRecord,
  PortableSyncPackage,
  RejectedOutboxItem,
  SyncDeletedIds,
  SyncSnapshot,
} from '../types/sync';
import { calculateAmortization } from '../lib/amortization';

const STORAGE_KEY = 'mobiloan.web.db';
const PAYMENT_EPSILON = 0.01;
const createLocalId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

interface WebDbState {
  meta: Record<string, string | null>;
  clients: ClientRecord[];
  loans: LoanRecord[];
  payments: PaymentRecord[];
  paymentTransactions: PaymentTransactionRecord[];
  outboxMutations: OutboxMutationRecord[];
}

const defaultState = (): WebDbState => ({
  meta: {},
  clients: [],
  loans: [],
  payments: [],
  paymentTransactions: [],
  outboxMutations: [],
});

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getStorage = () => {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
};

const loadState = (): WebDbState => {
  const storage = getStorage();
  if (!storage) {
    return defaultState();
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebDbState>;
    return {
      meta: parsed.meta ?? {},
      clients: parsed.clients ?? [],
      loans: parsed.loans ?? [],
      payments: parsed.payments ?? [],
      paymentTransactions: parsed.paymentTransactions ?? [],
      outboxMutations: parsed.outboxMutations ?? [],
    };
  } catch {
    return defaultState();
  }
};

const saveState = (state: WebDbState) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const updateState = async <T>(updater: (state: WebDbState) => T | Promise<T>): Promise<T> => {
  const state = loadState();
  const result = await updater(state);
  saveState(state);
  return result;
};

const isPastDue = (dueDate: string) => {
  const normalizedDueDate = dueDate.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return normalizedDueDate < today;
};

const derivePaymentStatus = (payment: {
  amount: number;
  lateFee: number;
  paidAmount: number;
  dueDate: string;
}): PaymentRecord['status'] => {
  const totalDue = payment.amount + payment.lateFee;

  if (payment.paidAmount >= totalDue - PAYMENT_EPSILON) {
    return 'Paid';
  }

  if (payment.paidAmount > 0) {
    return isPastDue(payment.dueDate) ? 'Overdue' : 'Partial';
  }

  return isPastDue(payment.dueDate) ? 'Overdue' : 'Pending';
};

const deriveLoanStatus = (payments: Array<Pick<PaymentRecord, 'status'>>) => {
  if (payments.length > 0 && payments.every((payment) => payment.status === 'Paid')) {
    return 'Paid' as const;
  }

  if (payments.some((payment) => payment.status === 'Overdue')) {
    return 'Overdue' as const;
  }

  return 'Active' as const;
};

const upsertById = <T extends { id: string }>(target: T[], records: T[]) => {
  for (const record of records) {
    const index = target.findIndex((item) => item.id === record.id);
    const nextRecord = clone(record);
    if (index >= 0) {
      target[index] = nextRecord;
    } else {
      target.push(nextRecord);
    }
  }
};

const sortByCreatedAt = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((left, right) => left.createdAt.localeCompare(right.createdAt));

const hydrateOutboxRow = (
  state: WebDbState,
  row: OutboxMutationRecord,
): PendingOutboxItem | RejectedOutboxItem => {
  const payment = state.payments.find((item) => item.id === row.payload.paymentId) ?? null;
  const loan = payment ? state.loans.find((item) => item.id === payment.loanId) ?? null : null;
  const client = loan ? state.clients.find((item) => item.id === loan.clientId) : null;
  const remainingAmount = payment
    ? Math.max(payment.amount + payment.lateFee - payment.paidAmount, 0)
    : null;

  return {
    ...clone(row),
    loanId: loan?.id ?? null,
    clientId: client?.id ?? null,
    clientName: client?.name ?? null,
    dueDate: payment?.dueDate ?? null,
    remainingAmount,
  };
};

export const localDb = {
  async init(): Promise<void> {
    saveState(loadState());
  },

  async resetSnapshot(): Promise<void> {
    await updateState((state) => {
      state.clients = [];
      state.loans = [];
      state.payments = [];
      state.paymentTransactions = [];
    });
  },

  async upsertClients(records: ClientRecord[]): Promise<void> {
    await updateState((state) => {
      upsertById(state.clients, records);
    });
  },

  async upsertLoans(records: LoanRecord[]): Promise<void> {
    await updateState((state) => {
      upsertById(state.loans, records);
    });
  },

  async upsertPayments(records: PaymentRecord[]): Promise<void> {
    await updateState((state) => {
      upsertById(state.payments, records);
    });
  },

  async upsertPaymentTransactions(records: PaymentTransactionRecord[]): Promise<void> {
    await updateState((state) => {
      upsertById(state.paymentTransactions, records);
    });
  },

  async applyDeletedIds(deletedIds: SyncDeletedIds): Promise<void> {
    await updateState((state) => {
      const deletedLoanIds = new Set(deletedIds.loans);
      const deletedClientIds = new Set(deletedIds.clients);
      const deletedPaymentIds = new Set(deletedIds.payments);
      const paymentIdsFromDeletedLoans = new Set(
        state.payments.filter((payment) => deletedLoanIds.has(payment.loanId)).map((payment) => payment.id),
      );
      const loanIdsFromDeletedClients = new Set(
        state.loans.filter((loan) => deletedClientIds.has(loan.clientId)).map((loan) => loan.id),
      );

      for (const paymentId of state.payments
        .filter((payment) => loanIdsFromDeletedClients.has(payment.loanId))
        .map((payment) => payment.id)) {
        deletedPaymentIds.add(paymentId);
      }

      state.paymentTransactions = state.paymentTransactions.filter(
        (transaction) =>
          !deletedIds.paymentTransactions.includes(transaction.id) &&
          !deletedPaymentIds.has(transaction.paymentId) &&
          !paymentIdsFromDeletedLoans.has(transaction.paymentId),
      );
      state.payments = state.payments.filter(
        (payment) => !deletedPaymentIds.has(payment.id) && !deletedLoanIds.has(payment.loanId),
      );
      state.loans = state.loans.filter(
        (loan) => !deletedLoanIds.has(loan.id) && !deletedClientIds.has(loan.clientId),
      );
      state.clients = state.clients.filter((client) => !deletedClientIds.has(client.id));
    });
  },

  async applyOptimisticPaymentTransaction(
    clientMutationId: string,
    payload: {
      paymentId: string;
      amount: number;
      paymentDate: string;
      method?: string;
      notes?: string;
    },
  ): Promise<void> {
    let loanId: string | null = null;

    await updateState((state) => {
      const payment = state.payments.find((item) => item.id === payload.paymentId);

      if (!payment) {
        throw new Error('Payment not found in local snapshot');
      }

      const remainingAmount = payment.amount + payment.lateFee - payment.paidAmount;
      if (remainingAmount <= PAYMENT_EPSILON || payment.status === 'Paid') {
        throw new Error('La cuota ya esta pagada en la base local.');
      }

      if (payload.amount > remainingAmount + PAYMENT_EPSILON) {
        throw new Error('El monto excede el saldo pendiente de la cuota.');
      }

      loanId = payment.loanId;
      const now = new Date().toISOString();
      payment.paidAmount += payload.amount;
      payment.status = derivePaymentStatus(payment);
      payment.updatedAt = now;

      state.paymentTransactions.push({
        id: clientMutationId,
        paymentId: payload.paymentId,
        amount: payload.amount,
        date: payload.paymentDate,
        method: payload.method || 'Cash',
        note: payload.notes || null,
        createdAt: now,
        updatedAt: now,
        clientMutationId,
      });
    });

    if (loanId) {
      await this.refreshLoanStatus(loanId);
    }
  },

  async revertOptimisticPaymentTransaction(clientMutationId: string): Promise<void> {
    let loanId: string | null = null;

    await updateState((state) => {
      const transaction = state.paymentTransactions.find(
        (item) => item.clientMutationId === clientMutationId,
      );

      if (!transaction) {
        return;
      }

      const payment = state.payments.find((item) => item.id === transaction.paymentId);
      if (!payment) {
        state.paymentTransactions = state.paymentTransactions.filter(
          (item) => item.clientMutationId !== clientMutationId,
        );
        return;
      }

      loanId = payment.loanId;
      payment.paidAmount = Math.max(payment.paidAmount - transaction.amount, 0);
      payment.status = derivePaymentStatus(payment);
      payment.updatedAt = new Date().toISOString();
      state.paymentTransactions = state.paymentTransactions.filter(
        (item) => item.clientMutationId !== clientMutationId,
      );
    });

    if (loanId) {
      await this.refreshLoanStatus(loanId);
    }
  },

  async refreshLoanStatus(loanId: string): Promise<void> {
    await updateState((state) => {
      const loan = state.loans.find((item) => item.id === loanId);
      if (!loan) {
        return;
      }

      const payments = state.payments.filter((item) => item.loanId === loanId);
      loan.status = deriveLoanStatus(payments);
      loan.updatedAt = new Date().toISOString();
    });
  },

  async setMeta(key: string, value: string | null): Promise<void> {
    await updateState((state) => {
      state.meta[key] = value;
    });
  },

  async getMeta(key: string): Promise<string | null> {
    const state = loadState();
    return state.meta[key] ?? null;
  },

  async listClients(search = ''): Promise<Array<ClientRecord & { activeLoanCount: number }>> {
    const state = loadState();
    const normalizedSearch = search.trim().toLowerCase();

    return [...state.clients]
      .filter((client) => {
        if (!normalizedSearch) {
          return true;
        }

        return [client.name, client.rut, client.phone]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((client) => ({
        ...clone(client),
        activeLoanCount: state.loans.filter(
          (loan) => loan.clientId === client.id && loan.status !== 'Paid',
        ).length,
      }));
  },

  async listCollectionQueue(filter: CollectionFilter): Promise<CollectionQueueItem[]> {
    const state = loadState();
    const today = new Date().toISOString().slice(0, 10);

    return state.payments
      .filter((payment) => {
        if (payment.status === 'Paid') {
          return false;
        }

        const dueDate = payment.dueDate.slice(0, 10);
        if (filter === 'overdue') {
          return dueDate < today;
        }
        if (filter === 'today') {
          return dueDate === today;
        }
        return dueDate > today;
      })
      .map((payment) => {
        const loan = state.loans.find((item) => item.id === payment.loanId);
        const client = loan ? state.clients.find((item) => item.id === loan.clientId) : null;

        return {
          paymentId: payment.id,
          loanId: payment.loanId,
          clientId: loan?.clientId ?? '',
          clientName: client?.name ?? 'Cliente',
          clientPhone: client?.phone ?? null,
          dueDate: payment.dueDate,
          amount: payment.amount,
          lateFee: payment.lateFee,
          paidAmount: payment.paidAmount,
          status: payment.status,
        };
      })
      .sort(
        (left, right) =>
          left.dueDate.localeCompare(right.dueDate) || left.clientName.localeCompare(right.clientName),
      );
  },

  async getClientDetail(clientId: string): Promise<{
    client: ClientRecord | null;
    loans: LoanRecord[];
  }> {
    const state = loadState();
    return {
      client: clone(state.clients.find((client) => client.id === clientId) ?? null),
      loans: state.loans
        .filter((loan) => loan.clientId === clientId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map((loan) => clone(loan)),
    };
  },

  async getLoanDetail(loanId: string): Promise<{
    loan: LoanRecord | null;
    client: ClientRecord | null;
    payments: PaymentRecord[];
    transactions: PaymentTransactionRecord[];
  }> {
    const state = loadState();
    const loan = state.loans.find((item) => item.id === loanId) ?? null;
    const client = loan ? state.clients.find((item) => item.id === loan.clientId) ?? null : null;
    const paymentIds = new Set(
      state.payments.filter((payment) => payment.loanId === loanId).map((payment) => payment.id),
    );

    return {
      loan: clone(loan),
      client: clone(client),
      payments: state.payments
        .filter((payment) => payment.loanId === loanId)
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
        .map((payment) => clone(payment)),
      transactions: state.paymentTransactions
        .filter((transaction) => paymentIds.has(transaction.paymentId))
        .sort(
          (left, right) =>
            right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt),
        )
        .map((transaction) => clone(transaction)),
    };
  },

  async createLocalClient(draft: LocalClientDraft): Promise<ClientRecord> {
    const now = new Date().toISOString();
    const client: ClientRecord = {
      id: createLocalId('client'),
      name: draft.name.trim(),
      rut: draft.rut?.trim() || null,
      phone: draft.phone?.trim() || null,
      email: draft.email?.trim() || null,
      address: draft.address?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    await updateState((state) => {
      state.clients.push(client);
    });

    return client;
  },

  async createLocalLoan(draft: LocalLoanDraft): Promise<{
    loan: LoanRecord;
    payments: PaymentRecord[];
  }> {
    const state = loadState();
    const client = state.clients.find((item) => item.id === draft.clientId);
    if (!client) {
      throw new Error('Primero debes crear o seleccionar un cliente valido.');
    }

    const now = new Date().toISOString();
    const loan: LoanRecord = {
      id: createLocalId('loan'),
      clientId: draft.clientId,
      amount: draft.amount,
      interestRate: draft.interestRate,
      durationMonths: draft.durationMonths,
      startDate: draft.startDate,
      frequency: draft.frequency,
      loanType: draft.loanType,
      status: 'Active',
      isPaused: false,
      createdAt: now,
      updatedAt: now,
    };

    const payments: PaymentRecord[] = calculateAmortization(
      draft.amount,
      draft.interestRate,
      draft.durationMonths,
      draft.startDate,
      draft.frequency,
      draft.loanType,
    ).map((item) => ({
      id: createLocalId('payment'),
      loanId: loan.id,
      amount: Number(item.amount.toFixed(2)),
      lateFee: 0,
      paidAmount: 0,
      dueDate: item.dueDate.toISOString(),
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    }));

    await updateState((nextState) => {
      nextState.loans.push(loan);
      nextState.payments.push(...payments);
    });

    return { loan, payments };
  },

  async addOutboxMutation(record: OutboxMutationRecord): Promise<void> {
    await updateState((state) => {
      upsertById(state.outboxMutations, [record]);
    });
  },

  async listPendingOutbox(): Promise<OutboxMutationRecord[]> {
    const state = loadState();
    return sortByCreatedAt(
      state.outboxMutations.filter((item) => item.status === 'pending').map((item) => clone(item)),
    );
  },

  async listPendingOutboxDetailed(): Promise<PendingOutboxItem[]> {
    const state = loadState();
    return sortByCreatedAt(
      state.outboxMutations
        .filter((item) => item.status === 'pending')
        .map((item) => hydrateOutboxRow(state, item) as PendingOutboxItem),
    );
  },

  async listRejectedOutbox(): Promise<RejectedOutboxItem[]> {
    const state = loadState();
    return state.outboxMutations
      .filter((item) => item.status === 'rejected')
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((item) => hydrateOutboxRow(state, item) as RejectedOutboxItem);
  },

  async markOutboxApplied(id: string): Promise<void> {
    await updateState((state) => {
      const mutation = state.outboxMutations.find((item) => item.id === id);
      if (!mutation) {
        return;
      }

      mutation.status = 'applied';
      mutation.errorCode = null;
      mutation.errorMessage = null;
      mutation.updatedAt = new Date().toISOString();
    });
  },

  async markOutboxRejected(id: string, errorCode: string | null, errorMessage: string | null): Promise<void> {
    await updateState((state) => {
      const mutation = state.outboxMutations.find((item) => item.id === id);
      if (!mutation) {
        return;
      }

      mutation.status = 'rejected';
      mutation.errorCode = errorCode;
      mutation.errorMessage = errorMessage;
      mutation.updatedAt = new Date().toISOString();
    });
  },

  async retryOutboxMutation(id: string): Promise<void> {
    await updateState((state) => {
      const mutation = state.outboxMutations.find((item) => item.id === id);
      if (!mutation) {
        return;
      }

      mutation.status = 'pending';
      mutation.errorCode = null;
      mutation.errorMessage = null;
      mutation.updatedAt = new Date().toISOString();
    });
  },

  async deleteOutboxMutation(id: string): Promise<void> {
    await updateState((state) => {
      state.outboxMutations = state.outboxMutations.filter((item) => item.id !== id);
    });
  },

  async getSnapshot(): Promise<SyncSnapshot> {
    const state = loadState();
    return {
      totalClients: state.clients.length,
      totalLoans: state.loans.length,
      totalPayments: state.payments.length,
      totalTransactions: state.paymentTransactions.length,
      pendingOutbox: state.outboxMutations.filter((item) => item.status === 'pending').length,
      rejectedOutbox: state.outboxMutations.filter((item) => item.status === 'rejected').length,
      lastCursor: state.meta.serverCursor ?? null,
      lastSyncAt: state.meta.lastSyncAt ?? null,
    };
  },

  async exportPortableSnapshot(): Promise<PortableSyncPackage> {
    const state = loadState();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: 'mobiloan-android',
      clients: clone(state.clients),
      loans: clone(state.loans),
      payments: clone(state.payments),
      paymentTransactions: clone(state.paymentTransactions),
      pendingOutbox: clone(state.outboxMutations.filter((item) => item.status === 'pending')),
    };
  },
};
