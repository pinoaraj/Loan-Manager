const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { calculateAmortization } = require('./utils/amortization');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: ['http://localhost:5173'], // Restrict to frontend only
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const loanRoutes = require('./routes/loans');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard'); // Import dashboard routes
const backupRoutes = require('./routes/backup');
const { authenticateToken } = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes); // Mount dashboard routes
app.use('/api/backup', backupRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Bulk Import API (Moved to protected inline for now, or could be its own route)
app.post('/api/import', authenticateToken, async (req, res) => {
    try {
        const { clients, loans } = req.body;

        const results = await prisma.$transaction(async (tx) => {
            const createdClients = [];
            const createdLoans = [];

            // 1. Create Clientes (those that are new)
            for (const clientData of clients) {
                // Remove the temporary ID used in frontend
                const { id, isNew, ...rest } = clientData;
                const client = await tx.client.create({ data: rest });
                createdClients.push({ oldId: id, newId: client.id });
            }

            // 2. Create Loans
            for (const loanData of loans) {
                const { clientName, ...rest } = loanData;

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
