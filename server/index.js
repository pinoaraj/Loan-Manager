require('dotenv').config();

const prisma = require('./lib/prisma');
const logger = require('./utils/logger');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3001;
const { app, allowedOrigins } = createApp();

app.listen(PORT, () => {
    logger.info(`âœ… Server started successfully on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
});

const shutdown = async () => {
    await prisma.$disconnect();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
