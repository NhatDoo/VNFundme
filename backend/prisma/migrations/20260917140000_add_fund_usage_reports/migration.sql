CREATE TABLE "FundUsageReport" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountUsed" DECIMAL(15,2) NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" UUID NOT NULL,
    "createdById" UUID NOT NULL,

    CONSTRAINT "FundUsageReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FundUsageReport_campaignId_usedAt_idx"
ON "FundUsageReport"("campaignId", "usedAt");

ALTER TABLE "FundUsageReport" ADD CONSTRAINT "FundUsageReport_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FundUsageReport" ADD CONSTRAINT "FundUsageReport_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
