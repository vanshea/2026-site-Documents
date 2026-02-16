-- AlterTable
ALTER TABLE "public"."Event"
ADD COLUMN IF NOT EXISTS "deviceType" VARCHAR(24),
ADD COLUMN IF NOT EXISTS "countryCode" VARCHAR(2);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_sessionSource_sessionMedium_eventTime_idx"
ON "public"."Event"("sessionSource", "sessionMedium", "eventTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_sessionCampaign_eventTime_idx"
ON "public"."Event"("sessionCampaign", "eventTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_referrerDomain_eventTime_idx"
ON "public"."Event"("referrerDomain", "eventTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_deviceType_eventTime_idx"
ON "public"."Event"("deviceType", "eventTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Event_countryCode_eventTime_idx"
ON "public"."Event"("countryCode", "eventTime");
