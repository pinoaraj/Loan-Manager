ALTER TABLE "Client" ADD COLUMN "rut" TEXT;

CREATE INDEX "Client_rut_idx" ON "Client"("rut");
