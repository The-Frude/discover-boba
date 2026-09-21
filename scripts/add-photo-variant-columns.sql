-- Pre-resized WebP variants of each shop's photo, generated once by
-- scripts/backfill-photo-variants.mjs and stored in Supabase Storage
-- (bucket: shop-photos), so pages can serve an already-correctly-sized
-- static file instead of routing shop.photos[0] through Vercel's
-- per-request (and quota-limited) image optimizer. Additive and
-- nullable: a shop with NULL here just falls back to today's behavior
-- (shop.photos[0], rendered unoptimized) until backfilled.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS photo_thumb_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS photo_hero_url TEXT;
