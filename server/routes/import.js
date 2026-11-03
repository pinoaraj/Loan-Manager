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

const toDateKey = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
    }

    const raw = String(value).trim();
    return raw ? raw.slice(0, 10) : null;
};

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

const sameLoanTerms = (loan, portableLoan, clientId, frequency, loanType) => (
    loan.clientId === clientId &&
    Number(loan.amount) === Number(portableLoan.amount) &&
    Number(loan.interestRate) === Number(portableLoan.interestRate) &&
    Number(loan.durationMonths) === Number(portableLoan.durationMonths) &&
    toDateKey(loan.startDate) === toDateKey(portableLoan.startDate) &&
    normalizeFrequency(loan.frequency) === frequency &&
    (loan.loanType || 'Fixed') === loanType
);

/**
 * Los paquetes anteriores a la importacion idempotente no guardaban el id del
 * telefono. Para no sumar una tercera copia se busca un prestamo con los mismos
 * terminos, ignorando los que ya quedaron vinculados en esta misma importacion.
 */
const findLoanByTerms = async (tx, clientId, portableLoan, frequency, loanType, claimedLoanIds) => {
    const candidates = await tx.loan.findMany({
        where: { clientId },
        orderBy: { createdAt: 'asc' }
    });

    return candidates.find((loan) => (
        !claimedLoanIds.has(loan.id) &&
        sameLoanTerms(loan, portableLoan, clientId, frequency, loanType)
    )) || null;
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
    const clientMappings = [];
    const touchedLoans = [];
    const importedTransactions = [];
    const claimedLoanIds = new Set();
    const portableClientIdMap = new Map();
    const portablePaymentsByLoanId = new Map();
    const portableTransactionsByPaymentId = new Map();
    let reusedTransactions = 0;

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

    // Clientes: primero por id estable, luego por RUT o nombre+telefono. Asi el
    // paquete se puede reimportar sin crear clientes nuevos.
    for (const clientData of clients) {
        const normalizedRut = clientData.rut ? String(clientData.rut).trim().toUpperCase() : null;
        const normalizedPhone = clientData.phone ? String(clientData.phone).trim() : null;
        const normalizedName = clientData.name.trim();
        const isServerOrigin = clientData.origin === 'server';
        const nextClientData = buildClientData({ ...clientData, rut: normalizedRut });

        let client = await tx.client.findUnique({ where: { id: clientData.id } });
        let matchedByTerms = false;

        if (!client && normalizedRut) {
            client = await tx.client.findFirst({ where: { rut: normalizedRut } });
            matchedByTerms = Boolean(client);
        }

        if (!client && normalizedPhone) {
            client = await tx.client.findFirst({
                where: {
                    name: normalizedName,
                    phone: normalizedPhone
                }
            });
            matchedByTerms = Boolean(client);
        }

        if (!client) {
            client = await tx.client.create({
                data: {
                    id: clientData.id,
                    ...nextClientData
                }
            });
        } else if (!isServerOrigin && !matchedByTerms) {
            const contactChanged = ['name', 'rut', 'phone', 'email', 'address'].some(
                (field) => (client[field] ?? null) !== (nextClientData[field] ?? null)
            );

            if (contactChanged) {
                client = await tx.client.update({
                    where: { id: client.id },
                    data: nextClientData
                });
            }
        }

        portableClientIdMap.set(clientData.id, client.id);
        clientMappings.push({ oldId: clientData.id, newId: client.id });
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
        const isServerOrigin = portableLoan.origin === 'server';
        const nextLoanData = {
            clientId: finalClientId,
            amount,
            interestRate,
            durationMonths,
            startDate: new Date(portableLoan.startDate),
            loanType,
            frequency,
            isPaused: Boolean(portableLoan.isPaused)
        };

        let loan = await tx.loan.findUnique({ where: { id: portableLoan.id } });

        if (!loan) {
            loan = await findLoanByTerms(
                tx,
                finalClientId,
                portableLoan,
                frequency,
                loanType,
                claimedLoanIds
            );
        }

        if (!loan) {
            loan = await tx.loan.create({
                data: {
                    id: portableLoan.id,
                    ...nextLoanData,
                    status: 'Active'
                }
            });
        } else if (!isServerOrigin) {
            const termsChanged = (
                loan.clientId !== finalClientId ||
                Number(loan.amount) !== amount ||
                Number(loan.interestRate) !== interestRate ||
                Number(loan.durationMonths) !== durationMonths ||
                toDateKey(loan.startDate) !== toDateKey(portableLoan.startDate) ||
                normalizeFrequency(loan.frequency) !== frequency ||
                (loan.loanType || 'Fixed') !== loanType ||
                Boolean(loan.isPaused) !== Boolean(portableLoan.isPaused)
            );

            if (termsChanged) {
                loan = await tx.loan.update({
                    where: { id: loan.id },
                    data: nextLoanData
                });
            }
        }

        claimedLoanIds.add(loan.id);

        const scheduleRows = calculateAmortization(
            Number(loan.amount),
            Number(loan.interestRate),
            Number(loan.durationMonths),
            toDateKey(loan.startDate),
            loan.frequency,
            loan.loanType
        );

        const portableLoanPayments = [...(portablePaymentsByLoanId.get(portableLoan.id) || [])]
            .sort((left, right) => sortByDate(left, right, 'dueDate'));

        const existingPayments = await tx.payment.findMany({
            where: { loanId: loan.id },
            orderBy: { dueDate: 'asc' }
        });

        const paymentsById = new Map(existingPayments.map((payment) => [payment.id, payment]));
        const paymentsByDate = new Map();

        for (const payment of existingPayments) {
            const key = toDateKey(payment.dueDate);
            if (key && !paymentsByDate.has(key)) {
                paymentsByDate.set(key, payment);
            }
        }

        const portablePaymentsByDate = new Map();
        for (const portablePayment of portableLoanPayments) {
            const key = toDateKey(portablePayment.dueDate);
            if (key && !portablePaymentsByDate.has(key)) {
                portablePaymentsByDate.set(key, portablePayment);
            }
        }

        const usedPortablePaymentIds = new Set();
        const paymentTargets = [];

        // Las cuotas se emparejan por fecha (y por id cuando existe). El indice
        // queda solo como ultimo recurso para paquetes incompletos.
        for (let index = 0; index < scheduleRows.length; index += 1) {
            const row = scheduleRows[index];
            const rowKey = toDateKey(row.dueDate);
            let portablePayment = rowKey ? portablePaymentsByDate.get(rowKey) : null;

            if (portablePayment && usedPortablePaymentIds.has(portablePayment.id)) {
                portablePayment = null;
            }

            if (!portablePayment) {
                const indexedPayment = portableLoanPayments[index];
                portablePayment =
                    indexedPayment && !usedPortablePaymentIds.has(indexedPayment.id)
                        ? indexedPayment
                        : null;
            }

            if (portablePayment) {
                usedPortablePaymentIds.add(portablePayment.id);
            }

            let payment =
                (portablePayment ? paymentsById.get(portablePayment.id) : null) ||
                (rowKey ? paymentsByDate.get(rowKey) : null) ||
                null;

            const importedPaidAmount = portablePayment ? Number(portablePayment.paidAmount || 0) : 0;
            const importedLateFee = portablePayment ? Number(portablePayment.lateFee || 0) : 0;

            if (!payment) {
                const paymentData = {
                    loanId: loan.id,
                    dueDate: row.dueDate,
                    amount: Number(row.amount),
                    principal: Number(row.principal),
                    interest: Number(row.interest),
                    paidAmount: importedPaidAmount,
                    lateFee: importedLateFee,
                    status: 'Pending'
                };

                if (portablePayment && !paymentsById.has(portablePayment.id)) {
                    paymentData.id = portablePayment.id;
                }

                payment = await tx.payment.create({ data: paymentData });
                paymentsById.set(payment.id, payment);

                if (rowKey && !paymentsByDate.has(rowKey)) {
                    paymentsByDate.set(rowKey, payment);
                }
            }

            paymentTargets.push({
                payment,
                portablePayment,
                importedPaidAmount,
                importedLateFee
            });
        }

        // Cuotas del telefono que no calzan con el calendario generado (por
        // ejemplo, un prestamo recalculado en el desktop). Se conservan.
        const totalScheduledAmount = scheduleRows.reduce((sum, row) => sum + Number(row.amount), 0);
        const totalScheduledPrincipal = scheduleRows.reduce((sum, row) => sum + Number(row.principal), 0);
        const principalShare = totalScheduledAmount > 0
            ? totalScheduledPrincipal / totalScheduledAmount
            : 1;

        for (const portablePayment of portableLoanPayments) {
            if (usedPortablePaymentIds.has(portablePayment.id)) {
                continue;
            }

            const key = toDateKey(portablePayment.dueDate);
            let payment =
                paymentsById.get(portablePayment.id) ||
                (key ? paymentsByDate.get(key) : null) ||
                null;

            const importedPaidAmount = Number(portablePayment.paidAmount || 0);
            const importedLateFee = Number(portablePayment.lateFee || 0);

            if (!payment) {
                const portableAmount = Number(portablePayment.amount || 0);
                const principal = portableAmount * principalShare;

                payment = await tx.payment.create({
                    data: {
                        id: portablePayment.id,
                        loanId: loan.id,
                        dueDate: new Date(portablePayment.dueDate),
                        amount: portableAmount,
                        principal,
                        interest: portableAmount - principal,
                        paidAmount: importedPaidAmount,
                        lateFee: importedLateFee,
                        status: 'Pending'
                    }
                });

                paymentsById.set(payment.id, payment);
                if (key) {
                    paymentsByDate.set(key, payment);
                }
            }

            paymentTargets.push({
                payment,
                portablePayment,
                importedPaidAmount,
                importedLateFee
            });
        }

        for (const target of paymentTargets) {
            const { payment, portablePayment, importedPaidAmount, importedLateFee } = target;

            if (portablePayment) {
                const portableTransactions = [...(portableTransactionsByPaymentId.get(portablePayment.id) || [])]
                    .sort((left, right) => sortByDate(left, right, 'date'));

                for (const portableTransaction of portableTransactions) {
                    let transaction = await tx.transaction.findUnique({
                        where: { id: portableTransaction.id }
                    });

                    if (!transaction && portableTransaction.clientMutationId) {
                        transaction = await tx.transaction.findFirst({
                            where: { clientMutationId: portableTransaction.clientMutationId }
                        });
                    }

                    if (!transaction) {
                        transaction = await tx.transaction.create({
                            data: {
                                id: portableTransaction.id,
                                paymentId: payment.id,
                                amount: Number(portableTransaction.amount),
                                date: new Date(portableTransaction.date),
                                method: portableTransaction.method || 'Cash',
                                note: portableTransaction.note || null,
                                clientMutationId: portableTransaction.clientMutationId || null
                            }
                        });
                        importedTransactions.push(transaction.id);
                    } else {
                        reusedTransactions += 1;
                    }
                }
            }

            const ledger = await tx.transaction.aggregate({
                where: { paymentId: payment.id },
                _sum: { amount: true }
            });
            const ledgerTotal = Number(ledger._sum.amount || 0);
            const paidAmount = Math.max(ledgerTotal, importedPaidAmount);
            const lateFee = Math.max(Number(payment.lateFee || 0), importedLateFee);
            const status = deriveImportedPaymentStatus({
                amount: Number(payment.amount),
                paidAmount,
                dueDate: payment.dueDate
            });

            if (
                Number(payment.paidAmount) !== paidAmount ||
                Number(payment.lateFee) !== lateFee ||
                payment.status !== status
            ) {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { paidAmount, lateFee, status }
                });
            }
        }

        const refreshedPayments = await tx.payment.findMany({
            where: { loanId: loan.id },
            orderBy: { dueDate: 'asc' }
        });

        const nextLoanStatus = deriveImportedLoanStatus(refreshedPayments);
        const updatedLoan = loan.status === nextLoanStatus
            ? loan
            : await tx.loan.update({
                where: { id: loan.id },
                data: { status: nextLoanStatus }
            });

        touchedLoans.push({
            loan: updatedLoan,
            payments: refreshedPayments
        });
    }

    return {
        createdClients: clientMappings,
        createdLoans: touchedLoans,
        mobileImportMeta: {
            exportedAt,
            importedTransactions: importedTransactions.length,
            reusedTransactions,
            ignoredPendingOutbox: pendingOutbox.length
        }
    };
}, {
    maxWait: 20000,
    timeout: 120000
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
module.exports.importMobiloanPortableData = importMobiloanPortableData;
