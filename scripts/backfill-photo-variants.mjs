import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';

// Resizes each shop's existing (already-verified-working) photo into two
// WebP variants and uploads them to Supabase Storage, so pages can render
// an already-correctly-sized static file instead of routing shop.photos[0]
// through Vercel's per-request image optimizer - the root cause of the
// 2026-09-21 image-transformation-quota outages. See
// scripts/add-photo-variant-columns.sql for the columns this fills in.
//
// Only needs the URL already in shop.photos[0] (set by
// backfill-missing-photos.mjs / verify-shop-photos.mjs) - does not call
// the Google Places API itself, so no API key/cost here.
//
// Usage:
//   node scripts/backfill-photo-variants.mjs --dry-run [--limit N]
//   node scripts/backfill-photo-variants.mjs [--limit N] [--force]
//
// Safe to re-run: skips shops that already have photo_thumb_url unless
// --force is passed.

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'shop-photos';
const VARIANTS = [
  { name: 'thumb', width: 256 },
  { name: 'hero', width: 828 },
];
const QUALITY = 80;
const DELAY_MS = 200;

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureBucket(supabase) {
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  // "already exists" is expected on every run after the first - anything
  // else is a real problem worth stopping for.
  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  if (!DRY_RUN) {
    await ensureBucket(supabase);
  }

  let query = supabase
    .from('shops')
    .select('id, name, city, photos, photo_thumb_url')
    .not('photos', 'is', null)
    .order('name');
  if (!FORCE) {
    query = query.is('photo_thumb_url', null);
  }
  const { data: shops, error: queryError } = await query;
  if (queryError) {
    console.error('Failed to query shops:', queryError.message);
    process.exit(1);
  }

  const toProcess = shops
    .filter((s) => Array.isArray(s.photos) && s.photos.length > 0 && s.photos[0])
    .slice(0, LIMIT ?? undefined);

  console.log(
    `${DRY_RUN ? '[DRY RUN] ' : ''}Generating photo variants for ${toProcess.length} shop(s)${
      LIMIT ? ` (limit ${LIMIT})` : ''
    }...`
  );

  let succeeded = 0;
  let failed = 0;
  const csvRows = [];

  for (const shop of toProcess) {
    const sourceUrl = shop.photos[0];
    try {
      const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`source fetch failed: ${res.status}`);
      const sourceBuffer = Buffer.from(await res.arrayBuffer());

      const urls = {};
      for (const variant of VARIANTS) {
        const resized = await sharp(sourceBuffer)
          .resize(variant.width)
          .webp({ quality: QUALITY })
          .toBuffer();

        const path = `${shop.id}/${variant.name}.webp`;

        if (!DRY_RUN) {
          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, resized, { contentType: 'image/webp', upsert: true });
          if (uploadError) throw new Error(`upload (${variant.name}) failed: ${uploadError.message}`);

          const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
          urls[variant.name] = publicUrlData.publicUrl;
        }
      }

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('shops')
          .update({ photo_thumb_url: urls.thumb, photo_hero_url: urls.hero })
          .eq('id', shop.id);
        if (updateError) throw new Error(`db update failed: ${updateError.message}`);
      }

      succeeded++;
      csvRows.push([shop.name, shop.city, 'ok', sourceUrl]);
    } catch (err) {
      failed++;
      console.error(`Failed for "${shop.name}" (${shop.city}): ${err.message}`);
      csvRows.push([shop.name, shop.city, `error:${err.message}`, sourceUrl]);
    }

    await sleep(DELAY_MS);
  }

  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csvContent = ['shop_name,city,result,source_photo_url', ...csvRows.map((r) => r.map(escape).join(','))].join(
    '\n'
  );
  const filename = DRY_RUN ? 'photo-variants-dry-run.csv' : 'photo-variants-applied.csv';
  const fs = await import('fs');
  fs.writeFileSync(filename, csvContent, 'utf-8');

  console.log('\nPhoto Variant Backfill Summary:');
  console.log(`Succeeded${DRY_RUN ? ' (not written, dry run)' : ''}: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nCSV written: ${filename}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
