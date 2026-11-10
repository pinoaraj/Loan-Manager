const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validate, paymentSchema } = require('../middleware/validation');
const prisma = require('../lib/prisma');
const { registerPaymentTransaction } = require('../utils/paymentTransactions');

// Get all payments
router.get('/', authenticateToken, async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            include: { loan: { include: { client: true } } }
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update payment status
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const payment = await prisma.payment.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register transaction
router.post('/:id/transactions', authenticateToken, validate(paymentSchema), async (req, res) => {
    try {
        const paymentId = req.params.id;
        const { amount, method, note, date, clientMutationId } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            return registerPaymentTransaction({
                paymentId,
                amount,
                method,
                note,
                date,
                clientMutationId
            }, tx);
        });

        res.json(result);
    } catch (error) {
        if (error.message === 'PAYMENT_NOT_FOUND') {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (error.message === 'INVALID_TRANSACTION_AMOUNT') {
            return res.status(400).json({ error: 'El monto del pago debe ser mayor que cero' });
        }

        if (error.message === 'PAYMENT_EXCEEDS_REMAINING_BALANCE') {
            return res.status(400).json({ error: 'El pago excede el saldo pendiente de la cuota' });
        }

        if (error.message === 'PAYMENT_ALREADY_CLOSED') {
            return res.status(400).json({ error: 'La cuota ya se encuentra pagada' });
        }

        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
