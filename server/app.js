const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const prisma = require('./lib/prisma');
const logger = require('./utils/logger');
const { loginLimiter, registerLimiter, apiLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const loanRoutes = require('./routes/loans');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const backupRoutes = require('./routes/backup');
const reportRoutes = require('./routes/reports');
const importRoutes = require('./routes/import');
const aiRoutes = require('./routes/ai');

function createApp() {
    const app = express();

    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));

    const defaultOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
        'http://127.0.0.1:4173',
        'app://localhost'
    ];
    const envOrigins = process.env.CORS_ORIGINS?.split(',')
        .map(origin => origin.trim())
        .filter(Boolean) || [];
    const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

    app.use(cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`CORS blocked request from origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    app.use('/api/auth/login', loginLimiter);
    app.use('/api/auth/register', registerLimiter);
    app.use('/api/auth', authRoutes);

    app.use('/api/', apiLimiter);
    app.use('/api/clients', clientRoutes);
    app.use('/api/loans', loanRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/backup', backupRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/import', importRoutes);
    app.use('/api/ai', aiRoutes);

    app.get('/api/health', async (req, res) => {
        try {
            await prisma.$queryRaw`SELECT 1`;

            res.json({
                status: 'ok',
                timestamp: new Date(),
                uptime: process.uptime(),
                database: 'connected'
            });
        } catch (error) {
            logger.error('Health check failed:', error);
            res.status(503).json({
                status: 'error',
                database: 'disconnected',
                error: error.message
            });
        }
    });

    app.use('/api', (req, res) => {
        res.status(404).json({ error: 'Endpoint not found' });
    });

    app.use((err, req, res, next) => {
        void req;
        void next;
        logger.error(`Unhandled Error: ${err.message}`);
        logger.error(err.stack);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });

    return { app, allowedOrigins };
}

module.exports = { createApp };
