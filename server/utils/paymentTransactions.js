const prisma = require('../lib/prisma');

const getLoanStatusFromPayments = (payments) => {
    if (payments.length > 0 && payments.every((payment) => payment.status === 'Paid')) {
        return 'Paid';
    }

    if (payments.some((payment) => payment.status === 'Overdue')) {
        return 'Overdue';
    }

    return 'Active';
};

const toAmount = (value) => Number(value || 0);
const PAYMENT_EPSILON = 0.01;

const registerPaymentTransaction = async ({
    paymentId,
    amount,
    method,
    note,
    date,
    clientMutationId
}, tx = prisma) => {
    const transactionAmount = parseFloat(amount);

    if (clientMutationId) {
        const existingTransaction = await tx.transaction.findUnique({
            where: { clientMutationId }
        });

        if (existingTransaction) {
            const updatedPayment = await tx.payment.findUnique({
                where: { id: existingTransaction.paymentId }
            });

            return {
                transaction: existingTransaction,
                updatedPayment,
                idempotentReplay: true
            };
        }
    }

    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
        throw new Error('PAYMENT_NOT_FOUND');
    }

    const currentPaidAmount = toAmount(payment.paidAmount);
    const totalDue = toAmount(payment.amount) + toAmount(payment.lateFee);
    const newPaidAmount = currentPaidAmount + transactionAmount;
    const remainingAmount = totalDue - currentPaidAmount;

    if (transactionAmount <= 0) {
        throw new Error('INVALID_TRANSACTION_AMOUNT');
    }

    if (remainingAmount <= PAYMENT_EPSILON || payment.status === 'Paid') {
        throw new Error('PAYMENT_ALREADY_CLOSED');
    }

    if (transactionAmount > remainingAmount + PAYMENT_EPSILON) {
        throw new Error('PAYMENT_EXCEEDS_REMAINING_BALANCE');
    }

    let newStatus = payment.status;
    if (newPaidAmount >= totalDue - PAYMENT_EPSILON) {
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
            date: date ? new Date(date) : new Date(),
            clientMutationId
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

    return {
        transaction,
        updatedPayment,
        idempotentReplay: false
    };
};

module.exports = {
    registerPaymentTransaction
};
