-- Initial schema for an empty database (CI `prisma migrate deploy`).
-- The live Supabase project was created with `db push` and supabase/migrations.
-- It has no Prisma migration history. Do not run this folder against that
-- database without a separate baseline plan.
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "region" TEXT,
    "photoUrl" TEXT,
    "parking" TEXT,
    "parking_note" TEXT,
    "accessibility" TEXT,
    "accessibility_note" TEXT,
    "createdById" UUID NOT NULL,
    "client_request_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotPhoto" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotReport" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "reporterId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Spot_lat_lng_idx" ON "Spot"("lat", "lng");

-- CreateIndex
CREATE INDEX "Spot_region_idx" ON "Spot"("region");

-- CreateIndex
CREATE UNIQUE INDEX "Spot_createdById_client_request_id_key" ON "Spot"("createdById", "client_request_id");

-- CreateIndex
CREATE INDEX "SpotPhoto_spotId_createdAt_idx" ON "SpotPhoto"("spotId", "createdAt");

-- CreateIndex
CREATE INDEX "SpotPhoto_uploadedById_idx" ON "SpotPhoto"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "SpotPhoto_spotId_url_key" ON "SpotPhoto"("spotId", "url");

-- CreateIndex
CREATE INDEX "SpotReport_spotId_createdAt_idx" ON "SpotReport"("spotId", "createdAt");

-- CreateIndex
CREATE INDEX "SpotReport_createdAt_idx" ON "SpotReport"("createdAt");

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotPhoto" ADD CONSTRAINT "SpotPhoto_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotPhoto" ADD CONSTRAINT "SpotPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotReport" ADD CONSTRAINT "SpotReport_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotReport" ADD CONSTRAINT "SpotReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Same checks as supabase/migrations/20261102170000_spot_parking_accessibility.sql.
-- Prisma stores these columns as text. The database still rejects other values.
ALTER TABLE "Spot" DROP CONSTRAINT IF EXISTS "Spot_parking_check";
ALTER TABLE "Spot"
  ADD CONSTRAINT "Spot_parking_check"
  CHECK (parking IS NULL OR parking IN ('yes', 'paid', 'no'));

ALTER TABLE "Spot" DROP CONSTRAINT IF EXISTS "Spot_accessibility_check";
ALTER TABLE "Spot"
  ADD CONSTRAINT "Spot_accessibility_check"
  CHECK (accessibility IS NULL OR accessibility IN ('yes', 'partial', 'no'));

ALTER TABLE "Spot" DROP CONSTRAINT IF EXISTS "Spot_parking_note_length";
ALTER TABLE "Spot"
  ADD CONSTRAINT "Spot_parking_note_length"
  CHECK (parking_note IS NULL OR char_length(parking_note) <= 200);

ALTER TABLE "Spot" DROP CONSTRAINT IF EXISTS "Spot_accessibility_note_length";
ALTER TABLE "Spot"
  ADD CONSTRAINT "Spot_accessibility_note_length"
  CHECK (accessibility_note IS NULL OR char_length(accessibility_note) <= 200);
