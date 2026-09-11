import pg from 'pg';
import dotenv from 'dotenv';

// One-time (re-runnable) backfill for shops whose stored photo URL doesn't
// actually resolve (has_working_photo = false - see verify-shop-photos.mjs,
// which is what sets that flag). Root cause of those broken URLs: they were
// scraped directly from Google Maps into the source CSVs
// (lh3.googleusercontent.com/gps-cs-s/... links), not fetched via Google's
// official Photo API, so they're not guaranteed to stay valid - roughly 40%
// already haven't.
//
// This fetches a real photo through the documented Places API (New) flow:
//   1. Place Details with fieldMask=photos -> a photo resource name
//   2. Place Photo Media on that name -> an actual, currently-valid image URI
// keyed off the same place_id-from-reviews_link extraction already proven
// in refresh-google-ratings.mjs. Replaces the shop's photos array with just
// the new URI (the old one is already known-broken, no reason to keep it)
// and re-verifies the new URL actually loads before marking
// has_working_photo = true, using the same check as verify-shop-photos.mjs.
//
// This does NOT run on a schedule - Google's officially-issued photo URIs
// can also expire after a number of months, so this is meant to be re-run
// periodically by hand (or wired into a schedule later) rather than
// treated as permanent.
//
// Usage:
//   node scripts/backfill-missing-photos.mjs --dry-run   (no writes, prints what would happen + a CSV)
//   node scripts/backfill-missing-photos.mjs              (writes for real)

dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const DELAY_MS = 200;
const PHOTO_MAX_WIDTH_PX = 800;
const DRY_RUN = process.argv.includes('--dry-run');

function extractPlaceId(reviewsLink) {
  if (!reviewsLink) return null;
  const match = reviewsLink.match(/placeid=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPhotoName(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'photos',
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    return { error: body?.error?.status || 'UNKNOWN_ERROR', message: body?.error?.message };
  }
  const photos = Array.isArray(body?.photos) ? body.photos : [];
  if (photos.length === 0) return { error: 'NO_PHOTOS' };
  return { photoName: photos[0].name };
}

async function fetchPhotoUri(photoName) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${PHOTO_MAX_WIDTH_PX}&skipHttpRedirect=true&key=${API_KEY}`;
  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    return { error: body?.error?.status || 'UNKNOWN_ERROR', message: body?.error?.message };
  }
  return { photoUri: body?.photoUri || null };
}

// Same verification verify-shop-photos.mjs uses, so "working" means the
// same thing everywhere in this codebase.
async function checkPhotoWorks(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    return contentType.startsWith('image/');
  } catch {
    try {
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
      if (!res.ok) return false;
      const contentType = res.headers.get('content-type') || '';
      return contentType.startsWith('image/');
    } catch {
      return false;
    }
  }
}

async function main() {
  if (!API_KEY) {
    console.error('GOOGLE_PLACES_API_KEY is not set');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  await client.connect();

  const { rows: shops } = await client.query(
    `SELECT id, name, city, reviews_link, photos
     FROM shops
     WHERE has_working_photo IS NOT TRUE
     ORDER BY name`
  );
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Backfilling photos for ${shops.length} shops without a working photo...`);

  let fixed = 0;
  let noPlaceId = 0;
  let noPhotosOnGoogle = 0;
  let fetchedButStillBroken = 0;
  let otherErrors = 0;
  const csvRows = [];

  for (const shop of shops) {
    const placeId = extractPlaceId(shop.reviews_link);
    if (!placeId) {
      noPlaceId++;
      csvRows.push([shop.name, shop.city, 'no_place_id', '']);
      continue;
    }

    const photoResult = await fetchPhotoName(placeId);
    await sleep(DELAY_MS);

    if (photoResult.error === 'NO_PHOTOS') {
      noPhotosOnGoogle++;
      csvRows.push([shop.name, shop.city, 'no_photos_on_google', '']);
      continue;
    }
    if (photoResult.error) {
      console.error(`Error fetching photo for "${shop.name}" (${shop.city}): ${photoResult.error} - ${photoResult.message}`);
      otherErrors++;
      csvRows.push([shop.name, shop.city, `error:${photoResult.error}`, '']);
      continue;
    }

    const uriResult = await fetchPhotoUri(photoResult.photoName);
    await sleep(DELAY_MS);

    if (uriResult.error || !uriResult.photoUri) {
      console.error(`Error resolving photo media for "${shop.name}" (${shop.city}): ${uriResult.error || 'no photoUri returned'}`);
      otherErrors++;
      csvRows.push([shop.name, shop.city, `error:${uriResult.error || 'no_uri'}`, '']);
      continue;
    }

    const works = await checkPhotoWorks(uriResult.photoUri);
    if (!works) {
      fetchedButStillBroken++;
      csvRows.push([shop.name, shop.city, 'fetched_but_still_broken', uriResult.photoUri]);
      continue;
    }

    csvRows.push([shop.name, shop.city, 'fixed', uriResult.photoUri]);
    fixed++;

    if (!DRY_RUN) {
      await client.query(
        `UPDATE shops
         SET photos = ARRAY[$1::text],
             has_working_photo = true,
             photo_checked_at = now()
         WHERE id = $2`,
        [uriResult.photoUri, shop.id]
      );
    }
  }

  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csvContent = ['shop_name,city,result,new_photo_url', ...csvRows.map((r) => r.map(escape).join(','))].join('\n');
  const filename = DRY_RUN ? 'photo-backfill-dry-run.csv' : 'photo-backfill-applied.csv';
  const fs = await import('fs');
  fs.writeFileSync(filename, csvContent, 'utf-8');

  console.log('\nPhoto Backfill Summary:');
  console.log(`Fixed (real working photo found${DRY_RUN ? ' - not written, dry run' : ' and saved'}): ${fixed}`);
  console.log(`No place_id: ${noPlaceId}`);
  console.log(`No photos on Google at all: ${noPhotosOnGoogle}`);
  console.log(`Fetched a URI but it still didn't load: ${fetchedButStillBroken}`);
  console.log(`Other errors: ${otherErrors}`);
  console.log(`\nCSV written: ${filename}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
