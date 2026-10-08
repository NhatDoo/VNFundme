ALTER TABLE "Campaign"
  ADD COLUMN "reviewerId" UUID,
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE INDEX "Campaign_reviewerId_idx" ON "Campaign"("reviewerId");

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
