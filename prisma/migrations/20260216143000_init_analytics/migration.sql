-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" BIGSERIAL NOT NULL,
    "eventName" VARCHAR(64) NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventDate" DATE NOT NULL,
    "userId" VARCHAR(64) NOT NULL,
    "sessionId" VARCHAR(64) NOT NULL,
    "pagePath" VARCHAR(255),
    "pageTitle" VARCHAR(200),
    "referrerDomain" VARCHAR(120),
    "sessionSource" VARCHAR(64),
    "sessionMedium" VARCHAR(64),
    "sessionCampaign" VARCHAR(120),
    "firstTouchSource" VARCHAR(64),
    "firstTouchMedium" VARCHAR(64),
    "firstTouchCampaign" VARCHAR(120),
    "slug" VARCHAR(120),
    "caseStudyTitle" VARCHAR(200),
    "percent" INTEGER,
    "location" VARCHAR(64),
    "method" VARCHAR(32),
    "destinationDomain" VARCHAR(120),
    "linkText" VARCHAR(120),
    "success" BOOLEAN,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyAggregate" (
    "id" BIGSERIAL NOT NULL,
    "day" DATE NOT NULL,
    "bucket" VARCHAR(64) NOT NULL,
    "metric" VARCHAR(64) NOT NULL,
    "dimension" VARCHAR(160),
    "value" DOUBLE PRECISION NOT NULL,
    "uniqueUsers" INTEGER,
    "sessions" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_eventTime_idx" ON "public"."Event"("eventTime");

-- CreateIndex
CREATE INDEX "Event_eventDate_eventName_idx" ON "public"."Event"("eventDate", "eventName");

-- CreateIndex
CREATE INDEX "Event_eventName_eventTime_idx" ON "public"."Event"("eventName", "eventTime");

-- CreateIndex
CREATE INDEX "Event_pagePath_eventTime_idx" ON "public"."Event"("pagePath", "eventTime");

-- CreateIndex
CREATE INDEX "Event_slug_eventTime_idx" ON "public"."Event"("slug", "eventTime");

-- CreateIndex
CREATE INDEX "Event_userId_eventTime_idx" ON "public"."Event"("userId", "eventTime");

-- CreateIndex
CREATE INDEX "Event_sessionId_eventTime_idx" ON "public"."Event"("sessionId", "eventTime");

-- CreateIndex
CREATE INDEX "DailyAggregate_day_bucket_idx" ON "public"."DailyAggregate"("day", "bucket");

-- CreateIndex
CREATE INDEX "DailyAggregate_bucket_metric_day_idx" ON "public"."DailyAggregate"("bucket", "metric", "day");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAggregate_day_bucket_metric_dimension_key" ON "public"."DailyAggregate"("day", "bucket", "metric", "dimension");

