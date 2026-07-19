-- Add structured engineering analysis payload to investigations
ALTER TABLE "Investigation" ADD COLUMN IF NOT EXISTS "analysisData" JSONB;
