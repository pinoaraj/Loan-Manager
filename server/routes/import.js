const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { calculateAmortization } = require('../utils/amortization');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// POST /api/import
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { clients, loans } = req.body;

        const results = await prisma.$transaction(async (tx) => {
            const createdClients = [];
            const createdLoans = [];

            // 1. Create Clientes (those that are new)
            for (const clientData of clients) {
                // Remove the temporary ID used in frontend
                const { id, ...rest } = clientData;
                const client = await tx.client.create({ data: rest });
                createdClients.push({ oldId: id, newId: client.id });
            }

            // 2. Create Loans
            for (const loanData of loans) {
                const { ...rest } = loanData;

                // If the clientId is a temporary one from this import, replace it with the new DB ID
                const clientRecord = createdClients.find(c => c.oldId === rest.clientId);
                const finalClientId = clientRecord ? clientRecord.newId : rest.clientId;

                const schedule = calculateAmortization(
                    parseFloat(rest.amount),
                    parseFloat(rest.interestRate),
                    parseInt(rest.durationMonths),
                    rest.startDate,
                    rest.frequency || 'monthly',
                    rest.loanType || 'Fixed'
                );

                const loan = await tx.loan.create({
                    data: {
                        ...rest,
                        clientId: finalClientId,
                        startDate: new Date(rest.startDate),
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
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
