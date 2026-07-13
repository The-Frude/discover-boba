-- Add coordinates to shops so the map can place markers without
-- geocoding every address on every page load.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_shops_lat_lng ON shops(latitude, longitude);
