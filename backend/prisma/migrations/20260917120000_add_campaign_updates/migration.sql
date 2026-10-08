CREATE TABLE "CampaignUpdate" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "amountUsed" DECIMAL(15,2),
    "campaignId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignUpdate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CampaignUpdate_campaignId_createdAt_idx"
ON "CampaignUpdate"("campaignId", "createdAt");

ALTER TABLE "CampaignUpdate"
ADD CONSTRAINT "CampaignUpdate_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
