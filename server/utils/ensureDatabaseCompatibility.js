const prisma = require('../lib/prisma');

const getTableColumns = async (tableName) => {
    return prisma.$queryRawUnsafe(`PRAGMA table_info("${tableName}")`);
};

const indexExists = async (indexName) => {
    const rows = await prisma.$queryRawUnsafe(
        `SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?`,
        indexName
    );

    return rows.length > 0;
};

const ensureTransactionSyncColumns = async () => {
    const columns = await getTableColumns('Transaction');
    const columnNames = new Set(columns.map((column) => column.name));

    if (!columnNames.has('updatedAt')) {
        await prisma.$executeRawUnsafe(
            'ALTER TABLE "Transaction" ADD COLUMN "updatedAt" DATETIME'
        );

        await prisma.$executeRawUnsafe(
            'UPDATE "Transaction" SET "updatedAt" = COALESCE("createdAt", "date", CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL'
        );
    }

    if (!columnNames.has('clientMutationId')) {
        await prisma.$executeRawUnsafe(
            'ALTER TABLE "Transaction" ADD COLUMN "clientMutationId" TEXT'
        );
    }

    if (!(await indexExists('Transaction_clientMutationId_key'))) {
        await prisma.$executeRawUnsafe(
            'CREATE UNIQUE INDEX "Transaction_clientMutationId_key" ON "Transaction"("clientMutationId")'
        );
    }

    if (!(await indexExists('Transaction_updatedAt_idx'))) {
        await prisma.$executeRawUnsafe(
            'CREATE INDEX "Transaction_updatedAt_idx" ON "Transaction"("updatedAt")'
        );
    }
};

const ensureSyncDeletedRecordsTable = async () => {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SyncDeletedRecord" (
            "id" TEXT PRIMARY KEY NOT NULL,
            "entity" TEXT NOT NULL,
            "recordId" TEXT NOT NULL,
            "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    if (!(await indexExists('SyncDeletedRecord_entity_deletedAt_idx'))) {
        await prisma.$executeRawUnsafe(
            'CREATE INDEX "SyncDeletedRecord_entity_deletedAt_idx" ON "SyncDeletedRecord"("entity", "deletedAt")'
        );
    }

    if (!(await indexExists('SyncDeletedRecord_recordId_idx'))) {
        await prisma.$executeRawUnsafe(
            'CREATE INDEX "SyncDeletedRecord_recordId_idx" ON "SyncDeletedRecord"("recordId")'
        );
    }
};

const ensureDatabaseCompatibility = async () => {
    await ensureTransactionSyncColumns();
    await ensureSyncDeletedRecordsTable();
};

module.exports = {
    ensureDatabaseCompatibility
};
