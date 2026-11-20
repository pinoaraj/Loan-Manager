const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverDir = path.resolve(__dirname, '..');
const sourceDbPath = path.join(serverDir, 'prisma', 'dev.db');
const dbPath = path.join(serverDir, 'prisma', 'test.mobiloan-import.db');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
process.env.CORS_ORIGINS = 'http://localhost:4173,http://localhost:5173';
process.env.DATABASE_URL = 'file:./test.mobiloan-import.db';

fs.rmSync(dbPath, { force: true });
fs.copyFileSync(sourceDbPath, dbPath);

const prisma = require('../lib/prisma');
const { createApp } = require('../app');
const { calculateAmortization } = require('../utils/amortization');

let server;
let baseUrl;

const START_DATE = '2026-03-15';
const LOAN_TERMS = {
    amount: 1200,
    interestRate: 0.1,
    durationMonths: 6,
    frequency: 'monthly',
    loanType: 'Fixed'
};

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

const createAuthHeaders = async () => {
    const registerResult = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            username: 'import-tester',
            password: 'super-secure-password'
        })
    });

    assert.equal(registerResult.response.status, 201);

    const loginResult = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            username: 'import-tester',
            password: 'super-secure-password'
        })
    });

    assert.equal(loginResult.response.status, 200);
    return { Authorization: `Bearer ${loginResult.body.token}` };
};

const buildSchedule = () => calculateAmortization(
    LOAN_TERMS.amount,
    LOAN_TERMS.interestRate,
    LOAN_TERMS.durationMonths,
    START_DATE,
    LOAN_TERMS.frequency,
    LOAN_TERMS.loanType
);

const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const buildPortablePackage = () => {
    const schedule = buildSchedule();
    const firstInstallment = Number(schedule[0].amount.toFixed(2));
    const firstHalf = Number((firstInstallment / 2).toFixed(2));

    const payments = schedule.map((row, index) => ({
        id: `payment-mobile-${index + 1}`,
        loanId: 'loan-mobile-1',
        amount: Number(row.amount.toFixed(2)),
        lateFee: 0,
        paidAmount: index === 0 ? firstInstallment : 0,
        dueDate: toDateKey(row.dueDate),
        status: index === 0 ? 'Paid' : 'Pending',
        origin: 'local',
        createdAt: '2026-03-15T12:00:00.000Z',
        updatedAt: '2026-03-15T12:00:00.000Z'
    }));

    return {
        source: 'mobiloan-portable',
        exportedAt: '2026-04-20T12:00:00.000Z',
        clients: [{
            id: 'client-mobile-1',
            name: 'Cliente Movil',
            rut: '11.111.111-1',
            email: 'movil@example.com',
            phone: '555-0202',
            address: 'Calle Movil 456',
            origin: 'local',
            createdAt: '2026-03-15T12:00:00.000Z',
            updatedAt: '2026-03-15T12:00:00.000Z'
        }],
        loans: [{
            id: 'loan-mobile-1',
            clientId: 'client-mobile-1',
            ...LOAN_TERMS,
            startDate: START_DATE,
            status: 'Active',
            isPaused: false,
            origin: 'local',
            createdAt: '2026-03-15T12:00:00.000Z',
            updatedAt: '2026-03-15T12:00:00.000Z'
        }],
        payments,
        paymentTransactions: [
            {
                id: 'transaction-mobile-1',
                paymentId: 'payment-mobile-1',
                amount: firstHalf,
                date: '2026-04-10',
                method: 'Cash',
                note: 'Primer abono',
                clientMutationId: 'mutation-mobile-1',
                createdAt: '2026-04-10T12:00:00.000Z',
                updatedAt: '2026-04-10T12:00:00.000Z'
            },
            {
                id: 'transaction-mobile-2',
                paymentId: 'payment-mobile-1',
                amount: firstInstallment - firstHalf,
                date: '2026-04-12',
                method: 'Transfer',
                note: null,
                clientMutationId: 'mutation-mobile-2',
                createdAt: '2026-04-12T12:00:00.000Z',
                updatedAt: '2026-04-12T12:00:00.000Z'
            }
        ],
        pendingOutbox: []
    };
};

const importPackage = async (authHeaders, portablePackage) => {
    const result = await request('/api/import', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(portablePackage)
    });

    assert.equal(result.response.status, 200, JSON.stringify(result.body));
    return result.body;
};

const countRecords = async () => ({
    clients: await prisma.client.count(),
    loans: await prisma.loan.count(),
    payments: await prisma.payment.count(),
    transactions: await prisma.transaction.count()
});

test.before(async () => {
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

test('validates and keeps the origin flag from the portable package', () => {
    const { importDataSchema } = require('../middleware/validationSchemas');
    const parsed = importDataSchema.parse(buildPortablePackage());

    assert.equal(parsed.clients[0].origin, 'local');
    assert.equal(parsed.loans[0].origin, 'local');
    assert.equal(parsed.payments[0].origin, 'local');
});

test('does not overwrite desktop edits when the package marks records as server origin', async () => {
    await resetDatabase();
    const authHeaders = await createAuthHeaders();
    const portablePackage = buildPortablePackage();

    await importPackage(authHeaders, portablePackage);

    await prisma.loan.update({
        where: { id: 'loan-mobile-1' },
        data: { amount: 1500 }
    });
    await prisma.client.update({
        where: { id: 'client-mobile-1' },
        data: { name: 'Nombre editado en desktop' }
    });

    const serverOriginPackage = {
        ...portablePackage,
        clients: portablePackage.clients.map((client) => ({ ...client, origin: 'server' })),
        loans: portablePackage.loans.map((loan) => ({ ...loan, origin: 'server' }))
    };

    await importPackage(authHeaders, serverOriginPackage);

    const loan = await prisma.loan.findUnique({ where: { id: 'loan-mobile-1' } });
    const client = await prisma.client.findUnique({ where: { id: 'client-mobile-1' } });

    assert.equal(Number(loan.amount), 1500);
    assert.equal(client.name, 'Nombre editado en desktop');
});

test('reimporting the same Mobiloan package keeps ids stable and does not duplicate records', async () => {
    await resetDatabase();
    const authHeaders = await createAuthHeaders();
    const portablePackage = buildPortablePackage();

    const firstImport = await importPackage(authHeaders, portablePackage);

    assert.deepEqual(firstImport.createdClients, [{
        oldId: 'client-mobile-1',
        newId: 'client-mobile-1'
    }]);
    assert.equal(firstImport.createdLoans.length, 1);
    assert.equal(firstImport.createdLoans[0].loan.id, 'loan-mobile-1');
    assert.equal(firstImport.createdLoans[0].payments.length, 6);
    assert.equal(firstImport.mobileImportMeta.importedTransactions, 2);
    assert.equal(firstImport.mobileImportMeta.reusedTransactions, 0);
    assert.deepEqual(await countRecords(), {
        clients: 1,
        loans: 1,
        payments: 6,
        transactions: 2
    });

    const secondImport = await importPackage(authHeaders, portablePackage);

    assert.equal(secondImport.createdClients[0].newId, 'client-mobile-1');
    assert.equal(secondImport.createdLoans[0].loan.id, 'loan-mobile-1');
    assert.equal(secondImport.mobileImportMeta.importedTransactions, 0);
    assert.equal(secondImport.mobileImportMeta.reusedTransactions, 2);
    assert.deepEqual(await countRecords(), {
        clients: 1,
        loans: 1,
        payments: 6,
        transactions: 2
    });

    const payments = await prisma.payment.findMany({ orderBy: { dueDate: 'asc' } });
    assert.deepEqual(
        payments.map((payment) => payment.id),
        portablePackage.payments.map((payment) => payment.id)
    );
    assert.equal(payments[0].status, 'Paid');
    assert.equal(Number(payments[0].paidAmount), portablePackage.payments[0].amount);

    const transactions = await prisma.transaction.findMany({ orderBy: { id: 'asc' } });
    assert.deepEqual(
        transactions.map((transaction) => transaction.id),
        ['transaction-mobile-1', 'transaction-mobile-2']
    );
});

test('reimporting a package already loaded by the old importer reuses desktop records by terms and dates', async () => {
    await resetDatabase();
    const authHeaders = await createAuthHeaders();
    const portablePackage = buildPortablePackage();
    const schedule = buildSchedule();

    // Reproduce lo que dejaba la importacion anterior: ids nuevos del desktop y
    // sin ningun vinculo con el paquete del telefono.
    await prisma.client.create({
        data: {
            id: 'desktop-client-1',
            name: 'Cliente Movil',
            rut: '11.111.111-1',
            email: 'movil@example.com',
            phone: '555-0202',
            address: 'Calle Movil 456'
        }
    });

    await prisma.loan.create({
        data: {
            id: 'desktop-loan-1',
            clientId: 'desktop-client-1',
            ...LOAN_TERMS,
            startDate: new Date(START_DATE),
            status: 'Active',
            isPaused: false
        }
    });

    for (const [index, row] of schedule.entries()) {
        await prisma.payment.create({
            data: {
                id: `desktop-payment-${index + 1}`,
                loanId: 'desktop-loan-1',
                dueDate: row.dueDate,
                amount: row.amount,
                principal: row.principal,
                interest: row.interest,
                paidAmount: 0,
                lateFee: 0,
                status: 'Pending'
            }
        });
    }

    const firstImport = await importPackage(authHeaders, portablePackage);

    assert.equal(firstImport.createdClients[0].newId, 'desktop-client-1');
    assert.equal(firstImport.createdLoans[0].loan.id, 'desktop-loan-1');
    assert.equal(firstImport.mobileImportMeta.importedTransactions, 2);
    assert.deepEqual(await countRecords(), {
        clients: 1,
        loans: 1,
        payments: 6,
        transactions: 2
    });

    const secondImport = await importPackage(authHeaders, portablePackage);

    assert.equal(secondImport.mobileImportMeta.importedTransactions, 0);
    assert.equal(secondImport.mobileImportMeta.reusedTransactions, 2);
    assert.deepEqual(await countRecords(), {
        clients: 1,
        loans: 1,
        payments: 6,
        transactions: 2
    });

    const client = await prisma.client.findUnique({ where: { id: 'desktop-client-1' } });
    assert.ok(client, 'el cliente del desktop debe conservarse');
    const loan = await prisma.loan.findUnique({ where: { id: 'desktop-loan-1' } });
    assert.ok(loan, 'el prestamo del desktop debe conservarse');
});
