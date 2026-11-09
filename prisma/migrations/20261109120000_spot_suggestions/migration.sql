-- Spot suggestions: pending rows stay out of the public site until approved.
-- Anonymous suggestions have a null createdById. Do not add an anon INSERT policy.
-- The live Supabase project may have no Prisma migration history. Apply this
-- SQL yourself (SQL editor or a baselined migrate). Do not point migrate deploy
-- at that database from CI.

ALTER TABLE "Spot" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE "Spot" ADD COLUMN "contributorName" TEXT;

ALTER TABLE "Spot" DROP CONSTRAINT IF EXISTS "Spot_status_check";
ALTER TABLE "Spot"
  ADD CONSTRAINT "Spot_status_check"
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE "Spot" DROP CONSTRAINT IF EXISTS "Spot_contributor_name_length";
ALTER TABLE "Spot"
  ADD CONSTRAINT "Spot_contributor_name_length"
  CHECK ("contributorName" IS NULL OR char_length("contributorName") <= 80);

CREATE INDEX "Spot_status_createdAt_idx" ON "Spot"("status", "createdAt");

ALTER TABLE "Spot" ALTER COLUMN "createdById" DROP NOT NULL;

-- Credit already-published spots when the owner's profile has a display name.
UPDATE "Spot" AS s
SET "contributorName" = btrim(p."displayName")
FROM "Profile" AS p
WHERE s."createdById" = p.id
  AND s."contributorName" IS NULL
  AND p."displayName" IS NOT NULL
  AND char_length(btrim(p."displayName")) BETWEEN 1 AND 80;
