const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { calculateAmortization } = require('../utils/amortization');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { importDataSchema } = require('../middleware/validationSchemas');

const prisma = new PrismaClient();

const normalizeFrequency = (frequency = 'monthly') => {
    const normalized = String(frequency).trim().toLowerCase();
    return normalized === 'biweekly' ? 'bi-weekly' : normalized;
};

const buildClientData = (clientData) => ({
    name: clientData.name.trim(),
    email: clientData.email || null,
    phone: clientData.phone || null,
    address: clientData.address || null
});

// POST /api/import
router.post('/', authenticateToken, validate(importDataSchema), async (req, res) => {
    try {
        const { clients, loans } = req.body;

        const results = await prisma.$transaction(async (tx) => {
            const createdClients = [];
            const createdLoans = [];

            // 1. Create Clientes (those that are new)
            for (const clientData of clients) {
                // Remove the temporary ID used in frontend
                const client = await tx.client.create({ data: buildClientData(clientData) });
                if (clientData.id) createdClients.push({ oldId: clientData.id, newId: client.id });
            }

            // 2. Create Loans
            for (const loanData of loans) {
                // If the clientId is a temporary one from this import, replace it with the new DB ID
                const clientRecord = createdClients.find(c => c.oldId === loanData.clientId);
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

                const payments = await Promise.all(schedule.map(p =>
                    tx.payment.create({
                        data: {
                            loanId: loan.id,
                            dueDate: p.dueDate,
                            amount: p.amount,
                            principal: p.principal,
                            interest: p.interest,
                            status: p.status
                        }
                    })
                ));

                createdLoans.push({ loan, payments });
            }

            return { createdClients, createdLoans };
        });

        res.json(results);
    } catch (error) {
        console.error('Import error:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
