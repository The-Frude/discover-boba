import pg from 'pg';
import dotenv from 'dotenv';

// Recurring (monthly, via .github/workflows/monthly-shop-refresh.yml) refresh
// of rating/review-count/business-status from Google Places API (New) Place
// Details, keyed off the place_id embedded in each shop's reviews_link.
//
// Unlike scripts/refresh-google-ratings.mjs (the one-time pilot this is
// descended from), this writes DIRECTLY to the live rating/
// user_ratings_total columns - there's no human in the loop for an
// unattended monthly run, so there's no staging/promotion step. Does NOT
// touch photos - that's scripts/backfill-missing-photos.mjs, a separate,
// one-time, manually-run script.
//
// Deliberately does not change shop visibility/filtering based on
// business_status - a shop that comes back CLOSED_PERMANENTLY is recorded
// (google_business_status column) but not hidden. That's an intentional,
// separate product decision, not something to change as a side effect of
// automating this script.
//
// Usage: node scripts/monthly-refresh-shop-data.mjs

dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const DELAY_MS = 150;
const DRY_RUN = process.argv.includes('--dry-run');

function extractPlaceId(reviewsLink) {
  if (!reviewsLink) return null;
  const match = reviewsLink.match(/placeid=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPlaceDetails(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'rating,userRatingCount,businessStatus',
    },
  });

  let body;
  try {
    body = await res.json();
  } catch {
    return { error: 'PARSE_ERROR', message: 'Response was not valid JSON' };
  }

  if (!res.ok) {
    const status = body?.error?.status || 'UNKNOWN_ERROR';
    return { error: status, message: body?.error?.message };
  }

  return {
    rating: typeof body.rating === 'number' ? body.rating : null,
    userRatingCount: typeof body.userRatingCount === 'number' ? body.userRatingCount : 0,
    businessStatus: body.businessStatus || null,
  };
}

// Writes to $GITHUB_STEP_SUMMARY when running in Actions, so the result is
// visible on the workflow run page without digging through logs. A no-op
// locally (the env var won't be set).
async function writeJobSummary(lines) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const fs = await import('fs');
  fs.appendFileSync(summaryPath, lines.join('\n') + '\n');
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
    'SELECT id, name, city, rating, user_ratings_total, google_business_status, reviews_link FROM shops ORDER BY name'
  );
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Refreshing Google data for ${shops.length} shops...`);

  let updated = 0;
  let noPlaceId = 0;
  let notFound = 0;
  let otherErrors = 0;
  const closedPermanently = [];
  const newlyClosedPermanently = [];

  for (const shop of shops) {
    const placeId = extractPlaceId(shop.reviews_link);

    if (!placeId) {
      console.warn(`No place_id: "${shop.name}" (${shop.city})`);
      noPlaceId++;
      continue;
    }

    const result = await fetchPlaceDetails(placeId);

    if (result.error) {
      if (result.error === 'NOT_FOUND') {
        console.warn(`NOT_FOUND: "${shop.name}" (${shop.city}) - place_id ${placeId}`);
        notFound++;
      } else {
        console.error(`Error for "${shop.name}" (${shop.city}): ${result.error} - ${result.message}`);
        otherErrors++;
      }
      await sleep(DELAY_MS);
      continue;
    }

    if (!DRY_RUN) {
      await client.query(
        `UPDATE shops
         SET rating = $1,
             user_ratings_total = $2,
             google_business_status = $3,
             google_refreshed_at = now()
         WHERE id = $4`,
        [result.rating, result.userRatingCount, result.businessStatus, shop.id]
      );
    }
    updated++;

    if (result.businessStatus === 'CLOSED_PERMANENTLY') {
      closedPermanently.push(`${shop.name} (${shop.city})`);
      if (shop.google_business_status !== 'CLOSED_PERMANENTLY') {
        newlyClosedPermanently.push(`${shop.name} (${shop.city})`);
      }
    }

    await sleep(DELAY_MS);
  }

  const summary = [
    '## Monthly shop data refresh',
    '',
    `- Updated: ${updated}`,
    `- No place_id (skipped): ${noPlaceId}`,
    `- NOT_FOUND: ${notFound}`,
    `- Other errors: ${otherErrors}`,
    `- Currently CLOSED_PERMANENTLY: ${closedPermanently.length}`,
    `- Newly CLOSED_PERMANENTLY this run: ${newlyClosedPermanently.length}`,
  ];
  if (newlyClosedPermanently.length > 0) {
    summary.push('', '### Newly closed this run', ...newlyClosedPermanently.map((s) => `- ${s}`));
  }

  console.log('\n' + summary.join('\n'));
  await writeJobSummary(summary);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
