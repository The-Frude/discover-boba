-- Staging columns for shop-level meta title/description generation and
-- description enrichment. Nothing renders from these until Step 4 of
-- discoverboba-shop-content-update-08sep2026.md, after pilot review.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS description_enriched text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS content_generated_at timestamptz;
