CREATE TABLE IF NOT EXISTS "SyncDeletedRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SyncDeletedRecord_entity_deletedAt_idx" ON "SyncDeletedRecord"("entity", "deletedAt");
CREATE INDEX IF NOT EXISTS "SyncDeletedRecord_recordId_idx" ON "SyncDeletedRecord"("recordId");
