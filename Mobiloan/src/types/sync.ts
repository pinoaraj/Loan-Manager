export type LoanFrequency = 'weekly' | 'bi-weekly' | 'monthly';
export type LoanType = 'Fixed' | 'Simple';
export type LoanStatus = 'Active' | 'Paid' | 'Overdue' | 'Closed';
export type PaymentStatus = 'Pending' | 'Partial' | 'Paid' | 'Overdue';

export interface ClientRecord {
  id: string;
  name: string;
  rut: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoanRecord {
  id: string;
  clientId: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  startDate: string;
  frequency: LoanFrequency;
  loanType: LoanType;
  status: LoanStatus;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  loanId: string;
  amount: number;
  lateFee: number;
  paidAmount: number;
  dueDate: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransactionRecord {
  id: string;
  paymentId: string;
  amount: number;
  date: string;
  method: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  clientMutationId: string | null;
}

export interface SyncBootstrapResponse {
  serverCursor: string;
  clients: ClientRecord[];
  loans: LoanRecord[];
  payments: PaymentRecord[];
  paymentTransactions: PaymentTransactionRecord[];
}

export interface SyncChangesResponse {
  serverCursor: string;
  changes: {
    clients: ClientRecord[];
    loans: LoanRecord[];
    payments: PaymentRecord[];
    paymentTransactions: PaymentTransactionRecord[];
  };
  deletedIds: SyncDeletedIds;
}

export interface SyncDeletedIds {
  clients: string[];
  loans: string[];
  payments: string[];
  paymentTransactions: string[];
}

export interface PaymentTransactionMutationPayload {
  paymentId: string;
  amount: number;
  paymentDate: string;
  method?: string;
  notes?: string;
}

export interface SyncMutation {
  clientMutationId: string;
  entity: 'paymentTransaction';
  operation: 'create';
  payload: PaymentTransactionMutationPayload;
}

export interface SyncPushResult {
  clientMutationId: string;
  status: 'applied' | 'rejected';
  serverId?: string;
  paymentId?: string;
  idempotentReplay?: boolean;
  errorCode?: string;
  message?: string;
}

export interface SyncPushResponse {
  serverCursor: string;
  results: SyncPushResult[];
}

export interface OutboxMutationRecord {
  id: string;
  entity: 'paymentTransaction';
  operation: 'create';
  payload: PaymentTransactionMutationPayload;
  status: 'pending' | 'applied' | 'rejected';
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RejectedOutboxItem extends OutboxMutationRecord {
  loanId: string | null;
  clientId: string | null;
  clientName: string | null;
  dueDate: string | null;
  remainingAmount: number | null;
}

export interface PendingOutboxItem extends OutboxMutationRecord {
  loanId: string | null;
  clientId: string | null;
  clientName: string | null;
  dueDate: string | null;
  remainingAmount: number | null;
}

export interface SessionRecord {
  token: string;
  username: string;
  mode?: 'remote' | 'local';
}

export interface SyncSnapshot {
  totalClients: number;
  totalLoans: number;
  totalPayments: number;
  totalTransactions: number;
  pendingOutbox: number;
  rejectedOutbox: number;
  lastCursor: string | null;
  lastSyncAt: string | null;
}

export type CollectionFilter = 'overdue' | 'today' | 'upcoming';

export interface CollectionQueueItem {
  paymentId: string;
  loanId: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  dueDate: string;
  amount: number;
  lateFee: number;
  paidAmount: number;
  status: PaymentStatus;
}

export interface LocalClientDraft {
  name: string;
  rut?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface LocalLoanDraft {
  clientId: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  startDate: string;
  frequency: LoanFrequency;
  loanType: LoanType;
}

export interface LocalReminderInput {
  clientName: string;
  clientPhone?: string | null;
  paymentId: string;
  loanId: string;
  amount: number;
  dueDate: string;
  installmentLabel: string;
}

export interface LocalReminderResult {
  calendarEventId: string;
  notificationId: string | null;
  scheduledFor: string;
}

export interface PortableSyncPackage {
  version: 1;
  exportedAt: string;
  source: 'mobiloan-android';
  clients: ClientRecord[];
  loans: LoanRecord[];
  payments: PaymentRecord[];
  paymentTransactions: PaymentTransactionRecord[];
  pendingOutbox: OutboxMutationRecord[];
}
