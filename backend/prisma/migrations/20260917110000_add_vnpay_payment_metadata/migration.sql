-- Preserve existing payments while adding the merchant reference used by VNPay.
ALTER TABLE "Payment" ADD COLUMN "reference" TEXT;
UPDATE "Payment"
SET "reference" = REPLACE("id"::text, '-', '')
WHERE "reference" IS NULL;
ALTER TABLE "Payment" ALTER COLUMN "reference" SET NOT NULL;

ALTER TABLE "Payment"
  ADD COLUMN "responseCode" TEXT,
  ADD COLUMN "bankCode" TEXT,
  ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");
