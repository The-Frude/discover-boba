-- Staging columns for the Google rating/review-count refresh. Don't
-- overwrite the live rating/user_ratings_total columns until reviewed
-- (see discoverboba-google-ratings-refresh-08sep2026.md Step 4).
ALTER TABLE shops ADD COLUMN IF NOT EXISTS rating_refreshed numeric;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS user_ratings_total_refreshed integer;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS google_business_status text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS google_refreshed_at timestamptz;
