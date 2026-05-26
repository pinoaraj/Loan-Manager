const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validate, paymentSchema } = require('../middleware/validation');
const prisma = require('../lib/prisma');

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

const getLoanStatusFromPayments = (payments) => {
    if (payments.length > 0 && payments.every((payment) => payment.status === 'Paid')) {
        return 'Paid';
    }

    if (payments.some((payment) => payment.status === 'Overdue')) {
        return 'Overdue';
    }

    return 'Active';
};

// Register transaction
router.post('/:id/transactions', authenticateToken, validate(paymentSchema), async (req, res) => {
    try {
        const paymentId = req.params.id;
        const { amount, method, note, date } = req.body;
        const transactionAmount = parseFloat(amount);

        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({ where: { id: paymentId } });
            if (!payment) {
                throw new Error('PAYMENT_NOT_FOUND');
            }

            const newPaidAmount = (payment.paidAmount || 0) + transactionAmount;
            const totalDue = payment.amount + (payment.lateFee || 0);
            const remainingAmount = totalDue - (payment.paidAmount || 0);

            if (transactionAmount <= 0) {
                throw new Error('INVALID_TRANSACTION_AMOUNT');
            }

            if (transactionAmount > remainingAmount + 0.01) {
                throw new Error('PAYMENT_EXCEEDS_REMAINING_BALANCE');
            }

            let newStatus = payment.status;
            if (newPaidAmount >= totalDue - 0.01) {
                newStatus = 'Paid';
            } else if (newPaidAmount > 0) {
                newStatus = payment.status === 'Overdue' ? 'Overdue' : 'Partial';
            }

            const transaction = await tx.transaction.create({
                data: {
                    paymentId,
                    amount: transactionAmount,
                    method: method || 'Cash',
                    note,
                    date: date ? new Date(date) : new Date()
                }
            });

            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    paidAmount: newPaidAmount,
                    status: newStatus
                }
            });

            const loanPayments = await tx.payment.findMany({
                where: { loanId: payment.loanId }
            });
            const nextLoanPayments = loanPayments.map((loanPayment) =>
                loanPayment.id === updatedPayment.id ? updatedPayment : loanPayment
            );

            await tx.loan.update({
                where: { id: payment.loanId },
                data: {
                    status: getLoanStatusFromPayments(nextLoanPayments)
                }
            });

            return { transaction, updatedPayment };
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

        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
