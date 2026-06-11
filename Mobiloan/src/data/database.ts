import * as SQLite from 'expo-sqlite';

import type {
  ClientRecord,
  CollectionFilter,
  CollectionQueueItem,
  LoanRecord,
  OutboxMutationRecord,
  PendingOutboxItem,
  PaymentRecord,
  RejectedOutboxItem,
  PaymentTransactionRecord,
  SyncSnapshot,
  SyncDeletedIds,
} from '../types/sync';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDatabase = async () => {
  databasePromise ??= SQLite.openDatabaseAsync('mobiloan.db');
  return databasePromise;
};

const serialize = (value: unknown) => JSON.stringify(value);

const parseJson = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const toNumber = (value: unknown) => Number(value || 0);
const PAYMENT_EPSILON = 0.01;

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

const hydrateOutboxRows = async (
  database: SQLite.SQLiteDatabase,
  rows: OutboxMutationRecord[],
): Promise<Array<PendingOutboxItem | RejectedOutboxItem>> =>
  Promise.all(
    rows.map(async (row) => {
      const paymentId = row.payload.paymentId;
      const paymentRow = paymentId
        ? await database.getFirstAsync<any>(
            `SELECT
               p.loanId AS loanId,
               p.dueDate AS dueDate,
               p.amount AS amount,
               p.lateFee AS lateFee,
               p.paidAmount AS paidAmount,
               l.clientId AS clientId,
               c.name AS clientName
             FROM payments p
             INNER JOIN loans l ON l.id = p.loanId
             INNER JOIN clients c ON c.id = l.clientId
             WHERE p.id = ?`,
            [paymentId],
          )
        : null;

      const remainingAmount = paymentRow
        ? Math.max(
            toNumber(paymentRow.amount) +
              toNumber(paymentRow.lateFee) -
              toNumber(paymentRow.paidAmount),
            0,
          )
        : null;

      return {
        ...row,
        loanId: paymentRow?.loanId ?? null,
        clientId: paymentRow?.clientId ?? null,
        clientName: paymentRow?.clientName ?? null,
        dueDate: paymentRow?.dueDate ?? null,
        remainingAmount,
      };
    }),
  );

export const localDb = {
  async init(): Promise<void> {
    const database = await getDatabase();
    await database.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        rut TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY NOT NULL,
        clientId TEXT NOT NULL,
        amount REAL NOT NULL,
        interestRate REAL NOT NULL,
        durationMonths INTEGER NOT NULL,
        startDate TEXT NOT NULL,
        frequency TEXT NOT NULL,
        loanType TEXT NOT NULL,
        status TEXT NOT NULL,
        isPaused INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY NOT NULL,
        loanId TEXT NOT NULL,
        amount REAL NOT NULL,
        lateFee REAL NOT NULL DEFAULT 0,
        paidAmount REAL NOT NULL DEFAULT 0,
        dueDate TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payment_transactions (
        id TEXT PRIMARY KEY NOT NULL,
        paymentId TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        method TEXT NOT NULL,
        note TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        clientMutationId TEXT UNIQUE
      );

      CREATE TABLE IF NOT EXISTS outbox_mutations (
        id TEXT PRIMARY KEY NOT NULL,
        entity TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL,
        errorCode TEXT,
        errorMessage TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_loans_clientId ON loans(clientId);
      CREATE INDEX IF NOT EXISTS idx_payments_loanId ON payments(loanId);
      CREATE INDEX IF NOT EXISTS idx_payments_dueDate ON payments(dueDate);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_paymentId ON payment_transactions(paymentId);
      CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_mutations(status);
    `);
  },

  async resetSnapshot(): Promise<void> {
    const database = await getDatabase();
    await database.execAsync(`
      DELETE FROM payment_transactions;
      DELETE FROM payments;
      DELETE FROM loans;
      DELETE FROM clients;
    `);
  },

  async upsertClients(records: ClientRecord[]): Promise<void> {
    const database = await getDatabase();
    for (const record of records) {
      await database.runAsync(
        `INSERT OR REPLACE INTO clients (id, name, rut, phone, email, address, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.name,
          record.rut,
          record.phone,
          record.email,
          record.address,
          record.createdAt,
          record.updatedAt,
        ],
      );
    }
  },

  async upsertLoans(records: LoanRecord[]): Promise<void> {
    const database = await getDatabase();
    for (const record of records) {
      await database.runAsync(
        `INSERT OR REPLACE INTO loans (id, clientId, amount, interestRate, durationMonths, startDate, frequency, loanType, status, isPaused, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.clientId,
          record.amount,
          record.interestRate,
          record.durationMonths,
          record.startDate,
          record.frequency,
          record.loanType,
          record.status,
          record.isPaused ? 1 : 0,
          record.createdAt,
          record.updatedAt,
        ],
      );
    }
  },

  async upsertPayments(records: PaymentRecord[]): Promise<void> {
    const database = await getDatabase();
    for (const record of records) {
      await database.runAsync(
        `INSERT OR REPLACE INTO payments (id, loanId, amount, lateFee, paidAmount, dueDate, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.loanId,
          record.amount,
          record.lateFee,
          record.paidAmount,
          record.dueDate,
          record.status,
          record.createdAt,
          record.updatedAt,
        ],
      );
    }
  },

  async upsertPaymentTransactions(records: PaymentTransactionRecord[]): Promise<void> {
    const database = await getDatabase();
    for (const record of records) {
      await database.runAsync(
        `INSERT OR REPLACE INTO payment_transactions (id, paymentId, amount, date, method, note, createdAt, updatedAt, clientMutationId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.paymentId,
          record.amount,
          record.date,
          record.method,
          record.note,
          record.createdAt,
          record.updatedAt,
          record.clientMutationId,
        ],
      );
    }
  },

  async applyDeletedIds(deletedIds: SyncDeletedIds): Promise<void> {
    const database = await getDatabase();

    for (const transactionId of deletedIds.paymentTransactions) {
      await database.runAsync(`DELETE FROM payment_transactions WHERE id = ?`, [transactionId]);
    }

    for (const paymentId of deletedIds.payments) {
      await database.runAsync(`DELETE FROM payment_transactions WHERE paymentId = ?`, [paymentId]);
      await database.runAsync(`DELETE FROM payments WHERE id = ?`, [paymentId]);
    }

    for (const loanId of deletedIds.loans) {
      await database.runAsync(
        `DELETE FROM payment_transactions WHERE paymentId IN (SELECT id FROM payments WHERE loanId = ?)`,
        [loanId],
      );
      await database.runAsync(`DELETE FROM payments WHERE loanId = ?`, [loanId]);
      await database.runAsync(`DELETE FROM loans WHERE id = ?`, [loanId]);
    }

    for (const clientId of deletedIds.clients) {
      await database.runAsync(
        `DELETE FROM payment_transactions
         WHERE paymentId IN (
           SELECT p.id
           FROM payments p
           INNER JOIN loans l ON l.id = p.loanId
           WHERE l.clientId = ?
         )`,
        [clientId],
      );
      await database.runAsync(
        `DELETE FROM payments WHERE loanId IN (SELECT id FROM loans WHERE clientId = ?)`,
        [clientId],
      );
      await database.runAsync(`DELETE FROM loans WHERE clientId = ?`, [clientId]);
      await database.runAsync(`DELETE FROM clients WHERE id = ?`, [clientId]);
    }
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
    const database = await getDatabase();
    const paymentRow = await database.getFirstAsync<any>(
      `SELECT * FROM payments WHERE id = ?`,
      [payload.paymentId],
    );

    if (!paymentRow) {
      throw new Error('Payment not found in local snapshot');
    }

    const optimisticAmount = toNumber(payload.amount);
    const remainingAmount =
      toNumber(paymentRow.amount) + toNumber(paymentRow.lateFee) - toNumber(paymentRow.paidAmount);

    if (remainingAmount <= PAYMENT_EPSILON || paymentRow.status === 'Paid') {
      throw new Error('La cuota ya esta pagada en la base local.');
    }

    if (optimisticAmount > remainingAmount + PAYMENT_EPSILON) {
      throw new Error('El monto excede el saldo pendiente de la cuota.');
    }

    const nextPaidAmount = toNumber(paymentRow.paidAmount) + optimisticAmount;
    const nextPayment: PaymentRecord = {
      ...paymentRow,
      amount: toNumber(paymentRow.amount),
      lateFee: toNumber(paymentRow.lateFee),
      paidAmount: nextPaidAmount,
      status: derivePaymentStatus({
        amount: toNumber(paymentRow.amount),
        lateFee: toNumber(paymentRow.lateFee),
        paidAmount: nextPaidAmount,
        dueDate: paymentRow.dueDate,
      }),
    };

    await database.runAsync(
      `INSERT OR REPLACE INTO payment_transactions (id, paymentId, amount, date, method, note, createdAt, updatedAt, clientMutationId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientMutationId,
        payload.paymentId,
        optimisticAmount,
        payload.paymentDate,
        payload.method || 'Cash',
        payload.notes || null,
        new Date().toISOString(),
        new Date().toISOString(),
        clientMutationId,
      ],
    );

    await database.runAsync(
      `UPDATE payments
       SET paidAmount = ?, status = ?, updatedAt = ?
       WHERE id = ?`,
      [nextPayment.paidAmount, nextPayment.status, new Date().toISOString(), payload.paymentId],
    );

    await this.refreshLoanStatus(paymentRow.loanId);
  },

  async revertOptimisticPaymentTransaction(clientMutationId: string): Promise<void> {
    const database = await getDatabase();
    const transactionRow = await database.getFirstAsync<any>(
      `SELECT * FROM payment_transactions WHERE clientMutationId = ?`,
      [clientMutationId],
    );

    if (!transactionRow) {
      return;
    }

    const paymentRow = await database.getFirstAsync<any>(
      `SELECT * FROM payments WHERE id = ?`,
      [transactionRow.paymentId],
    );

    if (!paymentRow) {
      await database.runAsync(`DELETE FROM payment_transactions WHERE clientMutationId = ?`, [clientMutationId]);
      return;
    }

    const nextPaidAmount = Math.max(
      toNumber(paymentRow.paidAmount) - toNumber(transactionRow.amount),
      0,
    );
    const nextStatus = derivePaymentStatus({
      amount: toNumber(paymentRow.amount),
      lateFee: toNumber(paymentRow.lateFee),
      paidAmount: nextPaidAmount,
      dueDate: paymentRow.dueDate,
    });

    await database.runAsync(`DELETE FROM payment_transactions WHERE clientMutationId = ?`, [clientMutationId]);
    await database.runAsync(
      `UPDATE payments
       SET paidAmount = ?, status = ?, updatedAt = ?
       WHERE id = ?`,
      [nextPaidAmount, nextStatus, new Date().toISOString(), paymentRow.id],
    );

    await this.refreshLoanStatus(paymentRow.loanId);
  },

  async refreshLoanStatus(loanId: string): Promise<void> {
    const database = await getDatabase();
    const paymentRows = await database.getAllAsync<any>(
      `SELECT status FROM payments WHERE loanId = ?`,
      [loanId],
    );
    const nextStatus = deriveLoanStatus(paymentRows);

    await database.runAsync(
      `UPDATE loans
       SET status = ?, updatedAt = ?
       WHERE id = ?`,
      [nextStatus, new Date().toISOString(), loanId],
    );
  },

  async setMeta(key: string, value: string | null): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)`,
      [key, value],
    );
  },

  async getMeta(key: string): Promise<string | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ value: string | null }>(
      `SELECT value FROM sync_meta WHERE key = ?`,
      [key],
    );
    return row?.value ?? null;
  },

  async listClients(search = ''): Promise<Array<ClientRecord & { activeLoanCount: number }>> {
    const database = await getDatabase();
    const normalizedSearch = `%${search.trim()}%`;
    const rows = await database.getAllAsync<any>(
      `SELECT c.*, COUNT(l.id) AS activeLoanCount
       FROM clients c
       LEFT JOIN loans l ON l.clientId = c.id AND l.status != 'Paid'
       WHERE (? = '%%')
          OR c.name LIKE ?
          OR IFNULL(c.rut, '') LIKE ?
          OR IFNULL(c.phone, '') LIKE ?
       GROUP BY c.id
       ORDER BY c.name ASC`,
      [normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch],
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      rut: row.rut,
      phone: row.phone,
      email: row.email,
      address: row.address,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      activeLoanCount: Number(row.activeLoanCount || 0),
    }));
  },

  async listCollectionQueue(filter: CollectionFilter): Promise<CollectionQueueItem[]> {
    const database = await getDatabase();
    const today = new Date().toISOString().slice(0, 10);

    const whereClause =
      filter === 'overdue'
        ? `date(substr(p.dueDate, 1, 10)) < date(?) AND p.status != 'Paid'`
        : filter === 'today'
          ? `date(substr(p.dueDate, 1, 10)) = date(?) AND p.status != 'Paid'`
          : `date(substr(p.dueDate, 1, 10)) > date(?) AND p.status != 'Paid'`;

    const rows = await database.getAllAsync<any>(
      `SELECT
          p.id AS paymentId,
          p.loanId AS loanId,
          l.clientId AS clientId,
          c.name AS clientName,
          c.phone AS clientPhone,
          p.dueDate AS dueDate,
          p.amount AS amount,
          p.lateFee AS lateFee,
          p.paidAmount AS paidAmount,
          p.status AS status
       FROM payments p
       INNER JOIN loans l ON l.id = p.loanId
       INNER JOIN clients c ON c.id = l.clientId
       WHERE ${whereClause}
       ORDER BY p.dueDate ASC, c.name ASC`,
      [today],
    );

    return rows.map((row) => ({
      paymentId: row.paymentId,
      loanId: row.loanId,
      clientId: row.clientId,
      clientName: row.clientName,
      clientPhone: row.clientPhone,
      dueDate: row.dueDate,
      amount: toNumber(row.amount),
      lateFee: toNumber(row.lateFee),
      paidAmount: toNumber(row.paidAmount),
      status: row.status,
    }));
  },

  async getClientDetail(clientId: string): Promise<{
    client: ClientRecord | null;
    loans: LoanRecord[];
  }> {
    const database = await getDatabase();
    const client = await database.getFirstAsync<ClientRecord>(
      `SELECT * FROM clients WHERE id = ?`,
      [clientId],
    );

    const rows = await database.getAllAsync<any>(
      `SELECT * FROM loans WHERE clientId = ? ORDER BY updatedAt DESC`,
      [clientId],
    );

    return {
      client: client ?? null,
      loans: rows.map((row) => ({
        ...row,
        amount: toNumber(row.amount),
        interestRate: toNumber(row.interestRate),
        durationMonths: Number(row.durationMonths),
        isPaused: Boolean(row.isPaused),
      })),
    };
  },

  async getLoanDetail(loanId: string): Promise<{
    loan: LoanRecord | null;
    client: ClientRecord | null;
    payments: PaymentRecord[];
    transactions: PaymentTransactionRecord[];
  }> {
    const database = await getDatabase();
    const loanRow = await database.getFirstAsync<any>(
      `SELECT * FROM loans WHERE id = ?`,
      [loanId],
    );

    if (!loanRow) {
      return {
        loan: null,
        client: null,
        payments: [],
        transactions: [],
      };
    }

    const client = await database.getFirstAsync<ClientRecord>(
      `SELECT * FROM clients WHERE id = ?`,
      [loanRow.clientId],
    );

    const paymentRows = await database.getAllAsync<any>(
      `SELECT * FROM payments WHERE loanId = ? ORDER BY dueDate ASC`,
      [loanId],
    );

    const transactionRows = await database.getAllAsync<any>(
      `SELECT t.*
       FROM payment_transactions t
       INNER JOIN payments p ON p.id = t.paymentId
       WHERE p.loanId = ?
       ORDER BY t.date DESC, t.createdAt DESC`,
      [loanId],
    );

    return {
      loan: {
        ...loanRow,
        amount: toNumber(loanRow.amount),
        interestRate: toNumber(loanRow.interestRate),
        durationMonths: Number(loanRow.durationMonths),
        isPaused: Boolean(loanRow.isPaused),
      },
      client: client ?? null,
      payments: paymentRows.map((row) => ({
        ...row,
        amount: toNumber(row.amount),
        lateFee: toNumber(row.lateFee),
        paidAmount: toNumber(row.paidAmount),
      })),
      transactions: transactionRows.map((row) => ({
        ...row,
        amount: toNumber(row.amount),
      })),
    };
  },

  async addOutboxMutation(record: OutboxMutationRecord): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT OR REPLACE INTO outbox_mutations (id, entity, operation, payload, status, errorCode, errorMessage, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.entity,
        record.operation,
        serialize(record.payload),
        record.status,
        record.errorCode,
        record.errorMessage,
        record.createdAt,
        record.updatedAt,
      ],
    );
  },

  async listPendingOutbox(): Promise<OutboxMutationRecord[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<any>(
      `SELECT * FROM outbox_mutations WHERE status = 'pending' ORDER BY createdAt ASC`,
    );

    return rows.map((row) => ({
      id: row.id,
      entity: row.entity,
      operation: row.operation,
      payload: parseJson(row.payload) ?? {},
      status: row.status,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })) as OutboxMutationRecord[];
  },

  async listPendingOutboxDetailed(): Promise<PendingOutboxItem[]> {
    const database = await getDatabase();
    const rows = await this.listPendingOutbox();
    return (await hydrateOutboxRows(database, rows)) as PendingOutboxItem[];
  },

  async listRejectedOutbox(): Promise<RejectedOutboxItem[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<any>(
      `SELECT * FROM outbox_mutations WHERE status = 'rejected' ORDER BY updatedAt DESC`,
    );

    const baseRows = rows.map((row) => ({
      id: row.id,
      entity: row.entity,
      operation: row.operation,
      payload: parseJson(row.payload) ?? {},
      status: row.status,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })) as OutboxMutationRecord[];

    return (await hydrateOutboxRows(database, baseRows)) as RejectedOutboxItem[];
  },

  async markOutboxApplied(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE outbox_mutations
       SET status = 'applied', errorCode = NULL, errorMessage = NULL, updatedAt = ?
       WHERE id = ?`,
      [new Date().toISOString(), id],
    );
  },

  async markOutboxRejected(id: string, errorCode: string | null, errorMessage: string | null): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE outbox_mutations
       SET status = 'rejected', errorCode = ?, errorMessage = ?, updatedAt = ?
       WHERE id = ?`,
      [errorCode, errorMessage, new Date().toISOString(), id],
    );
  },

  async retryOutboxMutation(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE outbox_mutations
       SET status = 'pending', errorCode = NULL, errorMessage = NULL, updatedAt = ?
       WHERE id = ?`,
      [new Date().toISOString(), id],
    );
  },

  async deleteOutboxMutation(id: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM outbox_mutations WHERE id = ?`, [id]);
  },

  async getSnapshot(): Promise<SyncSnapshot> {
    const database = await getDatabase();
    const [clients, loans, payments, transactions, pendingOutbox, rejectedOutbox, lastCursor, lastSyncAt] = await Promise.all([
      database.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM clients`),
      database.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM loans`),
      database.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM payments`),
      database.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM payment_transactions`),
      database.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM outbox_mutations WHERE status = 'pending'`),
      database.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM outbox_mutations WHERE status = 'rejected'`),
      this.getMeta('serverCursor'),
      this.getMeta('lastSyncAt'),
    ]);

    return {
      totalClients: Number(clients?.total || 0),
      totalLoans: Number(loans?.total || 0),
      totalPayments: Number(payments?.total || 0),
      totalTransactions: Number(transactions?.total || 0),
      pendingOutbox: Number(pendingOutbox?.total || 0),
      rejectedOutbox: Number(rejectedOutbox?.total || 0),
      lastCursor,
      lastSyncAt,
    };
  },
};
