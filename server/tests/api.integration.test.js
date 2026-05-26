const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverDir = path.resolve(__dirname, '..');
const sourceDbPath = path.join(serverDir, 'prisma', 'dev.db');
const dbPath = path.join(serverDir, 'prisma', 'test.integration.db');

fs.copyFileSync(sourceDbPath, dbPath);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
process.env.CORS_ORIGINS = 'http://localhost:4173,http://localhost:5173';
process.env.DATABASE_URL = 'file:./test.integration.db';

const prisma = require('../lib/prisma');
const { createApp } = require('../app');

let server;
let baseUrl;

test.before(async () => {
    await prisma.transaction.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();

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
            email: 'cliente@example.com',
            phone: '555-0101',
            address: 'Calle Falsa 123'
        })
    });

    assert.equal(clientResult.response.status, 200);
    assert.equal(clientResult.body.name, 'Cliente Prueba');

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
});

test('rejects invalid or excessive payment transactions', async () => {
    await prisma.transaction.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();

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

test('blocks recalculation when a loan already has registered transactions', async () => {
    await prisma.transaction.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();

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
