-- Adds columns for data that exists in the source CSVs but was dropped by
-- migrate-shops.mjs: the real Google-sourced shop description, reservation
-- links, and social handles. Run this in the Supabase SQL editor before
-- running `npm run backfill:descriptions`.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS reservation_links TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS booking_appointment_link TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS tiktok TEXT;
