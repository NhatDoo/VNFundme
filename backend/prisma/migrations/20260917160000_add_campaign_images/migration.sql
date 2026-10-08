CREATE TABLE "CampaignImage" (
    "id" UUID NOT NULL,
    "objectName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "campaignId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CampaignImage_objectName_key" ON "CampaignImage"("objectName");
CREATE UNIQUE INDEX "CampaignImage_campaignId_position_key" ON "CampaignImage"("campaignId", "position");
CREATE INDEX "CampaignImage_campaignId_position_idx" ON "CampaignImage"("campaignId", "position");

ALTER TABLE "CampaignImage"
ADD CONSTRAINT "CampaignImage_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
