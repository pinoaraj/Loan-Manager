const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
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

const importRoutes = require('./routes/import');

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/import', importRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
