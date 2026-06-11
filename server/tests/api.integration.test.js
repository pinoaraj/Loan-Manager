const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverDir = path.resolve(__dirname, '..');
const sourceDbPath = path.join(serverDir, 'prisma', 'dev.db');
const dbPath = path.join(serverDir, 'prisma', 'test.integration.db');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
process.env.CORS_ORIGINS = 'http://localhost:4173,http://localhost:5173';
process.env.DATABASE_URL = 'file:./test.integration.db';

fs.rmSync(dbPath, { force: true });
fs.copyFileSync(sourceDbPath, dbPath);

const prisma = require('../lib/prisma');
const { createApp } = require('../app');

let server;
let baseUrl;

const ensureSyncDeletedRecordTable = async () => {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SyncDeletedRecord" (
            "id" TEXT PRIMARY KEY NOT NULL,
            "entity" TEXT NOT NULL,
            "recordId" TEXT NOT NULL,
            "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "SyncDeletedRecord_entity_deletedAt_idx" ON "SyncDeletedRecord"("entity", "deletedAt")'
    );
    await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "SyncDeletedRecord_recordId_idx" ON "SyncDeletedRecord"("recordId")'
    );
};

const resetDatabase = async () => {
    await prisma.$executeRawUnsafe('DELETE FROM "SyncDeletedRecord"');
    await prisma.transaction.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
};

test.before(async () => {
    const clientColumns = await prisma.$queryRawUnsafe(`PRAGMA table_info('Client')`);
    if (!clientColumns.some((column) => column.name === 'rut')) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Client" ADD COLUMN "rut" TEXT');
    }

    const transactionColumns = await prisma.$queryRawUnsafe(`PRAGMA table_info('Transaction')`);
    if (!transactionColumns.some((column) => column.name === 'updatedAt')) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Transaction" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
    }
    if (!transactionColumns.some((column) => column.name === 'clientMutationId')) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Transaction" ADD COLUMN "clientMutationId" TEXT');
    }

    const transactionIndexes = await prisma.$queryRawUnsafe(`PRAGMA index_list('Transaction')`);
    if (!transactionIndexes.some((index) => index.name === 'Transaction_clientMutationId_key')) {
        await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX "Transaction_clientMutationId_key" ON "Transaction"("clientMutationId")');
    }
    if (!transactionIndexes.some((index) => index.name === 'Transaction_updatedAt_idx')) {
        await prisma.$executeRawUnsafe('CREATE INDEX "Transaction_updatedAt_idx" ON "Transaction"("updatedAt")');
    }

    await ensureSyncDeletedRecordTable();
    await resetDatabase();

    const { app } = createApp();
    server = await new Promise((resolve) => {
        const started = app.listen(0, () => resolve(started));
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
    if (server) {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    await prisma.$disconnect();
    fs.rmSync(dbPath, { force: true });
});

const request = async (pathname, options = {}) => {
    const response = await fetch(`${baseUrl}${pathname}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    return { response, body };
};

const createAuthenticatedLoanFixture = async () => {
    const registerResult = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            username: 'tester',
            password: 'super-secure-password'
        })
    });

    assert.equal(registerResult.response.status, 201);
    assert.ok(registerResult.body.userId);

    const loginResult = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            username: 'tester',
            password: 'super-secure-password'
        })
    });

    assert.equal(loginResult.response.status, 200);
    assert.ok(loginResult.body.token);

    const authHeaders = {
        Authorization: `Bearer ${loginResult.body.token}`
    };

    const clientResult = await request('/api/clients', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            name: 'Cliente Prueba',
            rut: '12.345.678-5',
            email: 'cliente@example.com',
            phone: '555-0101',
            address: 'Calle Falsa 123'
        })
    });

    assert.equal(clientResult.response.status, 200);
    assert.equal(clientResult.body.name, 'Cliente Prueba');
    assert.equal(clientResult.body.rut, '12.345.678-5');

    const loanResult = await request('/api/loans', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            clientId: clientResult.body.id,
            amount: 1200,
            interestRate: 0.1,
            durationMonths: 6,
            startDate: '2026-05-26',
            frequency: 'monthly',
            loanType: 'Fixed',
            graceDays: 3,
            lateFeeType: 'Fixed',
            lateFeeValue: 0
        })
    });

    assert.equal(loanResult.response.status, 200);
    assert.equal(loanResult.body.loan.status, 'Active');
    assert.equal(loanResult.body.payments.length, 6);

    return {
        authHeaders,
        client: clientResult.body,
        loan: loanResult.body.loan,
        payments: loanResult.body.payments
    };
};

test('registers, authenticates, creates a client, creates a loan, and records a partial payment', async () => {
    const fixture = await createAuthenticatedLoanFixture();

    const paymentId = fixture.payments[0].id;
    const firstInstallment = Number(fixture.payments[0].amount);
    const partialAmount = Number((firstInstallment / 2).toFixed(2));

    const transactionResult = await request(`/api/payments/${paymentId}/transactions`, {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            amount: partialAmount,
            method: 'Cash',
            note: 'Pago parcial de prueba'
        })
    });

    assert.equal(transactionResult.response.status, 200);
    assert.equal(Number(transactionResult.body.transaction.amount), partialAmount);
    assert.equal(transactionResult.body.updatedPayment.status, 'Partial');
    assert.equal(Number(transactionResult.body.updatedPayment.paidAmount), partialAmount);

    const loanDetailResult = await request(`/api/loans/${fixture.loan.id}`, {
        headers: fixture.authHeaders
    });

    assert.equal(loanDetailResult.response.status, 200);
    assert.equal(loanDetailResult.body.payments[0].transactions.length, 1);
    assert.equal(loanDetailResult.body.payments[0].status, 'Partial');

    const clientSearchResult = await request('/api/clients?search=12.345.678-5', {
        headers: fixture.authHeaders
    });

    assert.equal(clientSearchResult.response.status, 200);
    assert.equal(clientSearchResult.body.data.length, 1);
    assert.equal(clientSearchResult.body.data[0].rut, '12.345.678-5');
});

test('rejects invalid or excessive payment transactions', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();
    const payment = fixture.payments[0];

    const negativePayment = await request(`/api/payments/${payment.id}/transactions`, {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            amount: -10,
            method: 'Cash'
        })
    });

    assert.equal(negativePayment.response.status, 400);
    assert.equal(negativePayment.body.error, 'Validation Error');

    const excessivePayment = await request(`/api/payments/${payment.id}/transactions`, {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            amount: Number(payment.amount) + 100,
            method: 'Cash'
        })
    });

    assert.equal(excessivePayment.response.status, 400);
    assert.equal(excessivePayment.body.error, 'El pago excede el saldo pendiente de la cuota');
});

test('rejects transactions for a payment that is already closed', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();
    const payment = fixture.payments[0];
    const paymentTotal = Number(payment.amount) + Number(payment.lateFee || 0);

    const firstPayment = await request(`/api/payments/${payment.id}/transactions`, {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            amount: paymentTotal,
            method: 'Cash'
        })
    });

    assert.equal(firstPayment.response.status, 200);
    assert.equal(firstPayment.body.updatedPayment.status, 'Paid');

    const secondPayment = await request(`/api/payments/${payment.id}/transactions`, {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            amount: 1,
            method: 'Cash'
        })
    });

    assert.equal(secondPayment.response.status, 400);
    assert.equal(secondPayment.body.error, 'La cuota ya se encuentra pagada');
});

test('blocks recalculation when a loan already has registered transactions', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();
    const payment = fixture.payments[0];

    const partialPayment = await request(`/api/payments/${payment.id}/transactions`, {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            amount: 50,
            method: 'Cash'
        })
    });

    assert.equal(partialPayment.response.status, 200);

    const recalculateResult = await request(`/api/loans/${fixture.loan.id}/recalculate`, {
        method: 'POST',
        headers: fixture.authHeaders
    });

    assert.equal(recalculateResult.response.status, 400);
    assert.equal(recalculateResult.body.error, 'No se puede recalcular un prestamo con pagos registrados');
});

test('returns bootstrap data for offline sync', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();

    const transactionResult = await request(`/api/payments/${fixture.payments[0].id}/transactions`, {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            amount: 100,
            method: 'Cash',
            note: 'Bootstrap transaction',
            clientMutationId: 'bootstrap_txn_001'
        })
    });

    assert.equal(transactionResult.response.status, 200);

    const bootstrapResult = await request('/api/sync/bootstrap', {
        headers: fixture.authHeaders
    });

    assert.equal(bootstrapResult.response.status, 200);
    assert.ok(bootstrapResult.body.serverCursor);
    assert.equal(bootstrapResult.body.clients.length, 1);
    assert.equal(bootstrapResult.body.loans.length, 1);
    assert.equal(bootstrapResult.body.payments.length, 6);
    assert.equal(bootstrapResult.body.paymentTransactions.length, 1);
    assert.equal(bootstrapResult.body.paymentTransactions[0].clientMutationId, 'bootstrap_txn_001');
});

test('returns incremental sync changes after a cursor', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();

    const bootstrapResult = await request('/api/sync/bootstrap', {
        headers: fixture.authHeaders
    });

    assert.equal(bootstrapResult.response.status, 200);
    const cursor = bootstrapResult.body.serverCursor;
    assert.ok(cursor);

    await new Promise((resolve) => setTimeout(resolve, 25));

    const updatedClient = await request(`/api/clients/${fixture.client.id}`, {
        method: 'PUT',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            name: 'Cliente Prueba Editado',
            rut: '12.345.678-5',
            email: 'cliente@example.com',
            phone: '555-0202',
            address: 'Calle Actualizada 456'
        })
    });

    assert.equal(updatedClient.response.status, 200);

    const transactionResult = await request(`/api/payments/${fixture.payments[1].id}/transactions`, {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            amount: 75,
            method: 'Transfer',
            note: 'Incremental sync transaction',
            clientMutationId: 'changes_txn_001'
        })
    });

    assert.equal(transactionResult.response.status, 200);

    const changesResult = await request(`/api/sync/changes?cursor=${encodeURIComponent(cursor)}`, {
        headers: fixture.authHeaders
    });

    assert.equal(changesResult.response.status, 200);
    assert.ok(changesResult.body.serverCursor);
    assert.equal(changesResult.body.changes.clients.length, 1);
    assert.equal(changesResult.body.changes.clients[0].name, 'Cliente Prueba Editado');
    assert.equal(changesResult.body.changes.paymentTransactions.length, 1);
    assert.equal(changesResult.body.changes.paymentTransactions[0].clientMutationId, 'changes_txn_001');
    assert.deepEqual(changesResult.body.deletedIds, {
        clients: [],
        loans: [],
        payments: [],
        paymentTransactions: []
    });
});

test('returns deleted client ids after a client is removed', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();
    const extraClientResult = await request('/api/clients', {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            name: 'Cliente Sin Prestamo',
            rut: '11.111.111-1',
            email: 'sinprestamo@example.com',
            phone: '555-0303',
            address: 'Pasaje Borrado 789'
        })
    });

    assert.equal(extraClientResult.response.status, 200);

    const bootstrapResult = await request('/api/sync/bootstrap', {
        headers: fixture.authHeaders
    });

    assert.equal(bootstrapResult.response.status, 200);
    const cursor = bootstrapResult.body.serverCursor;
    assert.ok(cursor);

    await new Promise((resolve) => setTimeout(resolve, 25));

    const deleteResult = await request(`/api/clients/${extraClientResult.body.id}`, {
        method: 'DELETE',
        headers: fixture.authHeaders
    });

    assert.equal(deleteResult.response.status, 200);

    const changesResult = await request(`/api/sync/changes?cursor=${encodeURIComponent(cursor)}`, {
        headers: fixture.authHeaders
    });

    assert.equal(changesResult.response.status, 200);
    assert.ok(changesResult.body.deletedIds.clients.includes(extraClientResult.body.id));
    assert.equal(changesResult.body.deletedIds.payments.length, 0);
});

test('returns deleted payment ids after loan recalculation replaces the schedule', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();
    const originalPaymentIds = fixture.payments.map((payment) => payment.id);

    const bootstrapResult = await request('/api/sync/bootstrap', {
        headers: fixture.authHeaders
    });

    assert.equal(bootstrapResult.response.status, 200);
    const cursor = bootstrapResult.body.serverCursor;
    assert.ok(cursor);

    await new Promise((resolve) => setTimeout(resolve, 25));

    const recalculateResult = await request(`/api/loans/${fixture.loan.id}/recalculate`, {
        method: 'POST',
        headers: fixture.authHeaders
    });

    assert.equal(recalculateResult.response.status, 200);
    assert.equal(recalculateResult.body.payments.length, 6);

    const changesResult = await request(`/api/sync/changes?cursor=${encodeURIComponent(cursor)}`, {
        headers: fixture.authHeaders
    });

    assert.equal(changesResult.response.status, 200);
    assert.deepEqual(
        [...changesResult.body.deletedIds.payments].sort(),
        [...originalPaymentIds].sort()
    );
    assert.equal(changesResult.body.changes.payments.length, 6);
});

test('push applies payment transaction mutations in batch', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();

    const pushResult = await request('/api/sync/push', {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            mutations: [
                {
                    clientMutationId: 'push_txn_001',
                    entity: 'paymentTransaction',
                    operation: 'create',
                    payload: {
                        paymentId: fixture.payments[0].id,
                        amount: 80,
                        paymentDate: '2026-06-04',
                        method: 'Cash',
                        notes: 'Cobrado en terreno'
                    }
                }
            ]
        })
    });

    assert.equal(pushResult.response.status, 200);
    assert.ok(pushResult.body.serverCursor);
    assert.equal(pushResult.body.results.length, 1);
    assert.equal(pushResult.body.results[0].clientMutationId, 'push_txn_001');
    assert.equal(pushResult.body.results[0].status, 'applied');
    assert.equal(pushResult.body.results[0].idempotentReplay, false);

    const paymentAfterPush = await prisma.payment.findUnique({
        where: { id: fixture.payments[0].id }
    });
    assert.equal(Number(paymentAfterPush.paidAmount), 80);
    assert.equal(paymentAfterPush.status, 'Partial');
});

test('push is idempotent for repeated clientMutationId values', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();
    const mutation = {
        clientMutationId: 'push_txn_repeat_001',
        entity: 'paymentTransaction',
        operation: 'create',
        payload: {
            paymentId: fixture.payments[0].id,
            amount: 60,
            paymentDate: '2026-06-04',
            method: 'Transfer',
            notes: 'Retry-safe payment'
        }
    };

    const firstPush = await request('/api/sync/push', {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({ mutations: [mutation] })
    });

    const secondPush = await request('/api/sync/push', {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({ mutations: [mutation] })
    });

    assert.equal(firstPush.response.status, 200);
    assert.equal(secondPush.response.status, 200);
    assert.equal(firstPush.body.results[0].status, 'applied');
    assert.equal(secondPush.body.results[0].status, 'applied');
    assert.equal(secondPush.body.results[0].idempotentReplay, true);
    assert.equal(firstPush.body.results[0].serverId, secondPush.body.results[0].serverId);

    const transactionCount = await prisma.transaction.count({
        where: { clientMutationId: 'push_txn_repeat_001' }
    });
    assert.equal(transactionCount, 1);

    const paymentAfterRetry = await prisma.payment.findUnique({
        where: { id: fixture.payments[0].id }
    });
    assert.equal(Number(paymentAfterRetry.paidAmount), 60);
});

test('push reports rejected mutations without aborting the whole batch', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();
    const paymentTotal = Number(fixture.payments[0].amount) + Number(fixture.payments[0].lateFee || 0);

    const pushResult = await request('/api/sync/push', {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            mutations: [
                {
                    clientMutationId: 'push_txn_ok_001',
                    entity: 'paymentTransaction',
                    operation: 'create',
                    payload: {
                        paymentId: fixture.payments[0].id,
                        amount: 50,
                        paymentDate: '2026-06-04',
                        method: 'Cash',
                        notes: 'Valid payment'
                    }
                },
                {
                    clientMutationId: 'push_txn_fail_001',
                    entity: 'paymentTransaction',
                    operation: 'create',
                    payload: {
                        paymentId: fixture.payments[0].id,
                        amount: paymentTotal + 1,
                        paymentDate: '2026-06-04',
                        method: 'Cash',
                        notes: 'Invalid overpayment'
                    }
                }
            ]
        })
    });

    assert.equal(pushResult.response.status, 200);
    assert.equal(pushResult.body.results.length, 2);
    assert.equal(pushResult.body.results[0].status, 'applied');
    assert.equal(pushResult.body.results[1].status, 'rejected');
    assert.equal(pushResult.body.results[1].errorCode, 'OVERPAYMENT_BLOCKED');

    const transactionCount = await prisma.transaction.count();
    assert.equal(transactionCount, 1);
});

test('push reports closed payments with a dedicated error code', async () => {
    await resetDatabase();

    const fixture = await createAuthenticatedLoanFixture();
    const payment = fixture.payments[0];
    const paymentTotal = Number(payment.amount) + Number(payment.lateFee || 0);

    const closePaymentResult = await request(`/api/payments/${payment.id}/transactions`, {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            amount: paymentTotal,
            method: 'Cash',
            clientMutationId: 'close_payment_txn_001'
        })
    });

    assert.equal(closePaymentResult.response.status, 200);

    const pushResult = await request('/api/sync/push', {
        method: 'POST',
        headers: fixture.authHeaders,
        body: JSON.stringify({
            mutations: [
                {
                    clientMutationId: 'push_closed_txn_001',
                    entity: 'paymentTransaction',
                    operation: 'create',
                    payload: {
                        paymentId: payment.id,
                        amount: 10,
                        paymentDate: '2026-06-04',
                        method: 'Cash',
                        notes: 'Should fail because payment is closed'
                    }
                }
            ]
        })
    });

    assert.equal(pushResult.response.status, 200);
    assert.equal(pushResult.body.results.length, 1);
    assert.equal(pushResult.body.results[0].status, 'rejected');
    assert.equal(pushResult.body.results[0].errorCode, 'PAYMENT_ALREADY_CLOSED');
});
