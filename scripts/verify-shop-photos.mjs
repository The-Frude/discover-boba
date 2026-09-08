import pg from 'pg';
import dotenv from 'dotenv';

// One-time (re-runnable) check of whether each shop's stored photo URL
// actually resolves to a real image. Used to power the 3-tier default
// sort on city pages: real-description + working photo, then
// working-photo-only, then no working photo. Google-hosted photo URLs
// occasionally go stale, so this can be re-run periodically.

dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const CONCURRENCY = 20;
const TIMEOUT_MS = 8000;

async function checkPhoto(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    return contentType.startsWith('image/');
  } catch {
    // Some CDNs reject HEAD requests outright - retry once with GET
    // before giving up, since a false "broken" verdict is worse than a
    // slightly slower check.
    try {
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) return false;
      const contentType = res.headers.get('content-type') || '';
      return contentType.startsWith('image/');
    } catch {
      return false;
    }
  }
}

async function processBatch(shops) {
  return Promise.all(
    shops.map(async (shop) => {
      const photoUrl = shop.photos && shop.photos.length > 0 ? shop.photos[0] : null;
      const working = photoUrl ? await checkPhoto(photoUrl) : false;
      return { id: shop.id, working };
    })
  );
}

async function main() {
  await client.connect();

  const { rows: shops } = await client.query('SELECT id, photos FROM shops');
  console.log(`Checking photos for ${shops.length} shops...`);

  let working = 0;
  let broken = 0;
  let processed = 0;

  for (let i = 0; i < shops.length; i += CONCURRENCY) {
    const batch = shops.slice(i, i + CONCURRENCY);
    const results = await processBatch(batch);

    for (const { id, working: isWorking } of results) {
      await client.query(
        'UPDATE shops SET has_working_photo = $1, photo_checked_at = now() WHERE id = $2',
        [isWorking, id]
      );
      if (isWorking) working++;
      else broken++;
    }

    processed += batch.length;
    if (processed % 100 === 0 || processed === shops.length) {
      console.log(`Progress: ${processed}/${shops.length} (working: ${working}, broken/missing: ${broken})`);
    }
  }

  console.log(`\nDone. Working photos: ${working}. Broken/missing: ${broken}.`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
