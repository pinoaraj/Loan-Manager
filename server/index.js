require('dotenv').config();

const prisma = require('./lib/prisma');
const logger = require('./utils/logger');
const { createApp } = require('./app');
const { ensureDatabaseCompatibility } = require('./utils/ensureDatabaseCompatibility');

const PORT = process.env.PORT || 3011;
const { app, allowedOrigins } = createApp();

const startServer = async () => {
    await ensureDatabaseCompatibility();

    app.listen(PORT, () => {
        logger.info(`Server started successfully on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
    });
};

startServer().catch(async (error) => {
    logger.error(`Failed to start server: ${error.message}`);
    await prisma.$disconnect();
    process.exit(1);
});

const shutdown = async () => {
    await prisma.$disconnect();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
