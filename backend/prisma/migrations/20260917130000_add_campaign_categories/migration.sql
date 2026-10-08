CREATE TABLE "CampaignCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CampaignCategory_name_key" ON "CampaignCategory"("name");

ALTER TABLE "Campaign" ADD COLUMN "categoryId" UUID;
CREATE INDEX "Campaign_categoryId_idx" ON "Campaign"("categoryId");

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "CampaignCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
