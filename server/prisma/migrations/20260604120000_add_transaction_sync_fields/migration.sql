PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'Cash',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientMutationId" TEXT,
    CONSTRAINT "Transaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Transaction" (
    "id",
    "paymentId",
    "amount",
    "date",
    "method",
    "note",
    "createdAt",
    "updatedAt",
    "clientMutationId"
)
SELECT
    "id",
    "paymentId",
    "amount",
    "date",
    "method",
    "note",
    "createdAt",
    COALESCE("createdAt", "date", CURRENT_TIMESTAMP),
    NULL
FROM "Transaction";

DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";

CREATE UNIQUE INDEX "Transaction_clientMutationId_key" ON "Transaction"("clientMutationId");
CREATE INDEX "Transaction_paymentId_idx" ON "Transaction"("paymentId");
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX "Transaction_updatedAt_idx" ON "Transaction"("updatedAt");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
