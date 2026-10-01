const prisma = require('../lib/prisma');

const createSyncDeletedRecordId = (entity, recordId) => `${entity}:${recordId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

const recordDeletedEntities = async (entries, tx = prisma) => {
    if (!Array.isArray(entries) || entries.length === 0) {
        return;
    }

    for (const entry of entries) {
        if (!entry?.entity || !entry?.recordId) {
            continue;
        }

        await tx.$executeRawUnsafe(
            `
            INSERT INTO "SyncDeletedRecord" ("id", "entity", "recordId", "deletedAt")
            VALUES (?, ?, ?, ?)
            `,
            createSyncDeletedRecordId(entry.entity, entry.recordId),
            entry.entity,
            entry.recordId,
            new Date().toISOString()
        );
    }
};

module.exports = {
    recordDeletedEntities
};
