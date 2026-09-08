-- Tracks whether a shop's stored photo URL actually resolves to a real
-- image, used to sort shops with a working photo ahead of ones without
-- one on city listing pages. Populated by scripts/verify-shop-photos.mjs.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS has_working_photo BOOLEAN;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS photo_checked_at TIMESTAMPTZ;
