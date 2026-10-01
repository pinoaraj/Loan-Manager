const express = require('express');
const router = express.Router();
const { calculateAmortization } = require('../utils/amortization');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { importDataSchema } = require('../middleware/validationSchemas');
const prisma = require('../lib/prisma');

const normalizeFrequency = (frequency = 'monthly') => {
    const normalized = String(frequency).trim().toLowerCase();
    return normalized === 'biweekly' ? 'bi-weekly' : normalized;
};

const buildClientData = (clientData) => ({
    name: clientData.name.trim(),
    rut: clientData.rut || null,
    email: clientData.email || null,
    phone: clientData.phone || null,
    address: clientData.address || null
});

const sortByDate = (left, right, field) => new Date(left[field]).getTime() - new Date(right[field]).getTime();

const deriveImportedPaymentStatus = ({ amount, paidAmount, dueDate }) => {
    const totalDue = Number(amount || 0);
    const totalPaid = Number(paidAmount || 0);
    const today = new Date().toISOString().slice(0, 10);
    const normalizedDueDate = String(dueDate || '').slice(0, 10);

    if (totalPaid >= totalDue - 0.01) {
        return 'Paid';
    }

    if (totalPaid > 0) {
        return normalizedDueDate < today ? 'Overdue' : 'Partial';
    }

    return normalizedDueDate < today ? 'Overdue' : 'Pending';
};

const deriveImportedLoanStatus = (payments) => {
    if (payments.length > 0 && payments.every((payment) => payment.status === 'Paid')) {
        return 'Paid';
    }

    if (payments.some((payment) => payment.status === 'Overdue')) {
        return 'Overdue';
    }

    return 'Active';
};

const importSpreadsheetData = async ({ clients, loans }) => prisma.$transaction(async (tx) => {
    const createdClients = [];
    const createdLoans = [];

    for (const clientData of clients) {
        const client = await tx.client.create({ data: buildClientData(clientData) });
        if (clientData.id) {
            createdClients.push({ oldId: clientData.id, newId: client.id });
        }
    }

    for (const loanData of loans) {
        const clientRecord = createdClients.find((client) => client.oldId === loanData.clientId);
        const finalClientId = clientRecord ? clientRecord.newId : loanData.clientId;
        const existingClient = clientRecord ? null : await tx.client.findUnique({ where: { id: finalClientId } });

        if (!clientRecord && !existingClient) {
            throw new Error(`Client not found for imported loan: ${loanData.clientId}`);
        }

        const amount = Number(loanData.amount);
        const interestRate = Number(loanData.interestRate);
        const durationMonths = Number(loanData.durationMonths);
        const frequency = normalizeFrequency(loanData.frequency);
        const loanType = loanData.loanType || 'Fixed';

        const schedule = calculateAmortization(
            amount,
            interestRate,
            durationMonths,
            loanData.startDate,
            frequency,
            loanType
        );

        const loan = await tx.loan.create({
            data: {
                clientId: finalClientId,
                amount,
                interestRate,
                durationMonths,
                startDate: new Date(loanData.startDate),
                loanType,
                frequency,
                graceDays: Number.isInteger(loanData.graceDays) ? loanData.graceDays : 3,
                lateFeeType: loanData.lateFeeType || 'Fixed',
                lateFeeValue: loanData.lateFeeValue === undefined ? 0 : Number(loanData.lateFeeValue),
                status: 'Active'
            }
        });

        const payments = await Promise.all(schedule.map((payment) =>
            tx.payment.create({
                data: {
                    loanId: loan.id,
                    dueDate: payment.dueDate,
                    amount: payment.amount,
                    principal: payment.principal,
                    interest: payment.interest,
                    status: payment.status
                }
            })
        ));

        createdLoans.push({ loan, payments });
    }

    return { createdClients, createdLoans };
});

const importMobiloanPortableData = async ({
    clients,
    loans,
    payments,
    paymentTransactions,
    pendingOutbox = [],
    exportedAt
}) => prisma.$transaction(async (tx) => {
    const createdClients = [];
    const createdLoans = [];
    const importedTransactions = [];
    const portableClientIdMap = new Map();
    const portablePaymentsByLoanId = new Map();
    const portableTransactionsByPaymentId = new Map();

    for (const portablePayment of payments) {
        const bucket = portablePaymentsByLoanId.get(portablePayment.loanId) || [];
        bucket.push(portablePayment);
        portablePaymentsByLoanId.set(portablePayment.loanId, bucket);
    }

    for (const portableTransaction of paymentTransactions) {
        const bucket = portableTransactionsByPaymentId.get(portableTransaction.paymentId) || [];
        bucket.push(portableTransaction);
        portableTransactionsByPaymentId.set(portableTransaction.paymentId, bucket);
    }

    for (const clientData of clients) {
        let existingClient = null;
        const normalizedRut = clientData.rut ? String(clientData.rut).trim().toUpperCase() : null;
        const normalizedPhone = clientData.phone ? String(clientData.phone).trim() : null;
        const normalizedName = clientData.name.trim();

        if (normalizedRut) {
            existingClient = await tx.client.findFirst({
                where: { rut: normalizedRut }
            });
        }

        if (!existingClient && normalizedPhone) {
            existingClient = await tx.client.findFirst({
                where: {
                    name: normalizedName,
                    phone: normalizedPhone
                }
            });
        }

        if (!existingClient) {
            existingClient = await tx.client.create({
                data: buildClientData({
                    ...clientData,
                    rut: normalizedRut
                })
            });
            createdClients.push({ oldId: clientData.id, newId: existingClient.id });
        }

        portableClientIdMap.set(clientData.id, existingClient.id);
    }

    for (const portableLoan of loans) {
        const finalClientId = portableClientIdMap.get(portableLoan.clientId);
        if (!finalClientId) {
            throw new Error(`Client not found for Mobiloan loan: ${portableLoan.clientId}`);
        }

        const amount = Number(portableLoan.amount);
        const interestRate = Number(portableLoan.interestRate);
        const durationMonths = Number(portableLoan.durationMonths);
        const frequency = normalizeFrequency(portableLoan.frequency);
        const loanType = portableLoan.loanType || 'Fixed';

        const schedule = calculateAmortization(
            amount,
            interestRate,
            durationMonths,
            portableLoan.startDate,
            frequency,
            loanType
        );

        const loan = await tx.loan.create({
            data: {
                clientId: finalClientId,
                amount,
                interestRate,
                durationMonths,
                startDate: new Date(portableLoan.startDate),
                loanType,
                frequency,
                status: 'Active'
            }
        });

        const createdPayments = [];
        for (const payment of schedule) {
            const createdPayment = await tx.payment.create({
                data: {
                    loanId: loan.id,
                    dueDate: payment.dueDate,
                    amount: payment.amount,
                    principal: payment.principal,
                    interest: payment.interest,
                    status: payment.status
                }
            });
            createdPayments.push(createdPayment);
        }

        const importedPayments = [...(portablePaymentsByLoanId.get(portableLoan.id) || [])].sort((left, right) => sortByDate(left, right, 'dueDate'));
        const desktopPayments = [...createdPayments].sort((left, right) => sortByDate(left, right, 'dueDate'));

        for (let index = 0; index < Math.min(importedPayments.length, desktopPayments.length); index += 1) {
            const importedPayment = importedPayments[index];
            const desktopPayment = desktopPayments[index];
            const importedPaymentTransactions = [...(portableTransactionsByPaymentId.get(importedPayment.id) || [])].sort((left, right) => sortByDate(left, right, 'date'));

            let totalPaidAmount = 0;
            for (const portableTransaction of importedPaymentTransactions) {
                const createdTransaction = await tx.transaction.create({
                    data: {
                        paymentId: desktopPayment.id,
                        amount: Number(portableTransaction.amount),
                        date: new Date(portableTransaction.date),
                        method: portableTransaction.method || 'Cash',
                        note: portableTransaction.note || null,
                        clientMutationId: null
                    }
                });
                totalPaidAmount += Number(portableTransaction.amount);
                importedTransactions.push(createdTransaction.id);
            }

            const paidAmount = importedPaymentTransactions.length > 0
                ? totalPaidAmount
                : Number(importedPayment.paidAmount || 0);
            const paymentStatus = deriveImportedPaymentStatus({
                amount: desktopPayment.amount,
                paidAmount,
                dueDate: desktopPayment.dueDate
            });

            await tx.payment.update({
                where: { id: desktopPayment.id },
                data: {
                    paidAmount,
                    lateFee: Number(importedPayment.lateFee || 0),
                    status: paymentStatus
                }
            });
        }

        const refreshedPayments = await tx.payment.findMany({
            where: { loanId: loan.id },
            orderBy: { dueDate: 'asc' }
        });

        const nextLoanStatus = deriveImportedLoanStatus(refreshedPayments);
        const updatedLoan = await tx.loan.update({
            where: { id: loan.id },
            data: { status: nextLoanStatus }
        });

        createdLoans.push({
            loan: updatedLoan,
            payments: refreshedPayments
        });
    }

    return {
        createdClients,
        createdLoans,
        mobileImportMeta: {
            exportedAt,
            importedTransactions: importedTransactions.length,
            ignoredPendingOutbox: pendingOutbox.length
        }
    };
});

// POST /api/import
router.post('/', authenticateToken, validate(importDataSchema), async (req, res) => {
    try {
        const results = req.body.source === 'mobiloan-portable'
            ? await importMobiloanPortableData(req.body)
            : await importSpreadsheetData(req.body);

        res.json(results);
    } catch (error) {
        console.error('Import error:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
