const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

const prisma = globalForPrisma.__loanManagerPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__loanManagerPrisma = prisma;
}

module.exports = prisma;
