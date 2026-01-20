const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

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
router.post('/:id/transactions', authenticateToken, async (req, res) => {
    try {
        const paymentId = req.params.id;
        const { amount, method, note, date } = req.body;
        const transactionAmount = parseFloat(amount);

        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    paymentId,
                    amount: transactionAmount,
                    method: method || 'Cash',
                    note,
                    date: date ? new Date(date) : new Date()
                }
            });

            const payment = await tx.payment.findUnique({ where: { id: paymentId } });

            const newPaidAmount = (payment.paidAmount || 0) + transactionAmount;
            const totalDue = payment.amount + (payment.lateFee || 0);

            let newStatus = payment.status;
            if (newPaidAmount >= totalDue - 0.01) {
                newStatus = 'Paid';
            } else if (newPaidAmount > 0) {
                newStatus = 'Partial';
            }

            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    paidAmount: newPaidAmount,
                    status: newStatus
                }
            });

            return { transaction, updatedPayment };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
