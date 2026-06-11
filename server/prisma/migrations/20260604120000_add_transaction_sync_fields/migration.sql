ALTER TABLE "Transaction" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Transaction" ADD COLUMN "clientMutationId" TEXT;

CREATE UNIQUE INDEX "Transaction_clientMutationId_key" ON "Transaction"("clientMutationId");
CREATE INDEX "Transaction_updatedAt_idx" ON "Transaction"("updatedAt");
