const express = require('express');
const router = express.Router();
const { z } = require('zod');

const { authenticateToken } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { registerPaymentTransaction } = require('../utils/paymentTransactions');

const buildCursorFilter = (cursor, snapshotTime) => ({
    gt: cursor,
    lte: snapshotTime
});

const toDateOrNull = (value) => {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const fetchBootstrapData = async () => {
    const [clients, loans, payments, paymentTransactions] = await Promise.all([
        prisma.client.findMany({
            orderBy: [
                { updatedAt: 'asc' },
                { id: 'asc' }
            ]
        }),
        prisma.loan.findMany({
            orderBy: [
                { updatedAt: 'asc' },
                { id: 'asc' }
            ]
        }),
        prisma.payment.findMany({
            orderBy: [
                { updatedAt: 'asc' },
                { id: 'asc' }
            ]
        }),
        prisma.transaction.findMany({
            orderBy: [
                { updatedAt: 'asc' },
                { id: 'asc' }
            ]
        })
    ]);

    return { clients, loans, payments, paymentTransactions };
};

const fetchChangesSince = async (cursor, snapshotTime) => {
    const updatedAtFilter = buildCursorFilter(cursor, snapshotTime);

    const [clients, loans, payments, paymentTransactions] = await Promise.all([
        prisma.client.findMany({
            where: { updatedAt: updatedAtFilter },
            orderBy: [
                { updatedAt: 'asc' },
                { id: 'asc' }
            ]
        }),
        prisma.loan.findMany({
            where: { updatedAt: updatedAtFilter },
            orderBy: [
                { updatedAt: 'asc' },
                { id: 'asc' }
            ]
        }),
        prisma.payment.findMany({
            where: { updatedAt: updatedAtFilter },
            orderBy: [
                { updatedAt: 'asc' },
                { id: 'asc' }
            ]
        }),
        prisma.transaction.findMany({
            where: { updatedAt: updatedAtFilter },
            orderBy: [
                { updatedAt: 'asc' },
                { id: 'asc' }
            ]
        })
    ]);

    return { clients, loans, payments, paymentTransactions };
};

const fetchDeletedIdsSince = async (cursor, snapshotTime) => {
    const rows = await prisma.$queryRawUnsafe(
        `
        SELECT entity, recordId
        FROM "SyncDeletedRecord"
        WHERE deletedAt > ? AND deletedAt <= ?
        ORDER BY deletedAt ASC, id ASC
        `,
        cursor.toISOString(),
        snapshotTime.toISOString()
    );

    const deletedIds = {
        clients: [],
        loans: [],
        payments: [],
        paymentTransactions: []
    };

    for (const row of rows) {
        if (row.entity === 'client') {
            deletedIds.clients.push(row.recordId);
        } else if (row.entity === 'loan') {
            deletedIds.loans.push(row.recordId);
        } else if (row.entity === 'payment') {
            deletedIds.payments.push(row.recordId);
        } else if (row.entity === 'paymentTransaction') {
            deletedIds.paymentTransactions.push(row.recordId);
        }
    }

    return deletedIds;
};

const pushMutationSchema = z.object({
    clientMutationId: z.string().min(1),
    entity: z.literal('paymentTransaction'),
    operation: z.literal('create'),
    payload: z.object({
        paymentId: z.string().min(1),
        amount: z.number().positive(),
        paymentDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        method: z.string().optional(),
        notes: z.string().optional()
    })
});

const pushBodySchema = z.object({
    mutations: z.array(pushMutationSchema)
});

const mapSyncError = (error) => {
    if (error.message === 'PAYMENT_NOT_FOUND') {
        return {
            status: 'rejected',
            errorCode: 'INVALID_MUTATION',
            message: 'Payment not found'
        };
    }

    if (error.message === 'INVALID_TRANSACTION_AMOUNT') {
        return {
            status: 'rejected',
            errorCode: 'INVALID_MUTATION',
            message: 'El monto del pago debe ser mayor que cero'
        };
    }

    if (error.message === 'PAYMENT_EXCEEDS_REMAINING_BALANCE') {
        return {
            status: 'rejected',
            errorCode: 'OVERPAYMENT_BLOCKED',
            message: 'El pago excede el saldo pendiente de la cuota'
        };
    }

    if (error.message === 'PAYMENT_ALREADY_CLOSED') {
        return {
            status: 'rejected',
            errorCode: 'PAYMENT_ALREADY_CLOSED',
            message: 'La cuota ya se encuentra cerrada'
        };
    }

    return {
        status: 'rejected',
        errorCode: 'SYNC_CONFLICT',
        message: error.message
    };
};

router.get('/bootstrap', authenticateToken, async (req, res) => {
    try {
        const serverCursor = new Date();
        const data = await fetchBootstrapData();

        res.json({
            serverCursor: serverCursor.toISOString(),
            ...data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/changes', authenticateToken, async (req, res) => {
    try {
        const cursor = toDateOrNull(req.query.cursor);
        if (!cursor) {
            return res.status(400).json({ error: 'CURSOR_REQUIRED' });
        }

        const serverCursor = new Date();
        const changes = await fetchChangesSince(cursor, serverCursor);
        const deletedIds = await fetchDeletedIdsSince(cursor, serverCursor);

        res.json({
            serverCursor: serverCursor.toISOString(),
            changes,
            deletedIds
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/push', authenticateToken, async (req, res) => {
    try {
        const parsed = pushBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'INVALID_MUTATION',
                details: parsed.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const results = [];

        for (const mutation of parsed.data.mutations) {
            try {
                const outcome = await prisma.$transaction(async (tx) => {
                    return registerPaymentTransaction({
                        paymentId: mutation.payload.paymentId,
                        amount: mutation.payload.amount,
                        method: mutation.payload.method,
                        note: mutation.payload.notes,
                        date: mutation.payload.paymentDate,
                        clientMutationId: mutation.clientMutationId
                    }, tx);
                });

                results.push({
                    clientMutationId: mutation.clientMutationId,
                    status: 'applied',
                    serverId: outcome.transaction.id,
                    paymentId: outcome.updatedPayment?.id || mutation.payload.paymentId,
                    idempotentReplay: outcome.idempotentReplay
                });
            } catch (error) {
                results.push({
                    clientMutationId: mutation.clientMutationId,
                    ...mapSyncError(error)
                });
            }
        }

        res.json({
            serverCursor: new Date().toISOString(),
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
