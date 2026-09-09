import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

// Backfills rating/review-count/business-status from Google Places API
// (New) Place Details, keyed off the place_id already embedded in each
// shop's reviews_link. Writes to staging columns only (rating_refreshed,
// user_ratings_total_refreshed, google_business_status) - the live
// rating/user_ratings_total columns are untouched until Step 4's
// promotion UPDATE, after review.
//
// Usage: node scripts/refresh-google-ratings.mjs [CityName]
// With no city arg, processes all shops. Optional city arg scopes to a
// pilot batch and also writes a review CSV for that city.

dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const DELAY_MS = 150;

const cityArg = process.argv[2];

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

async function main() {
  if (!API_KEY) {
    console.error('GOOGLE_PLACES_API_KEY is not set in .env');
    process.exit(1);
  }

  await client.connect();

  let query = 'SELECT id, name, city, rating, reviews_link FROM shops';
  const params = [];
  if (cityArg) {
    query += ' WHERE city = $1';
    params.push(cityArg);
  }
  query += ' ORDER BY name';

  const { rows: shops } = await client.query(query, params);
  console.log(`Refreshing Google data for ${shops.length} shops${cityArg ? ` in ${cityArg}` : ''}...`);

  let updated = 0;
  let noPlaceId = 0;
  let notFound = 0;
  let otherErrors = 0;
  const closedPermanently = [];

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

    await client.query(
      `UPDATE shops
       SET rating_refreshed = $1,
           user_ratings_total_refreshed = $2,
           google_business_status = $3,
           google_refreshed_at = now()
       WHERE id = $4`,
      [result.rating, result.userRatingCount, result.businessStatus, shop.id]
    );
    updated++;

    if (result.businessStatus === 'CLOSED_PERMANENTLY') {
      closedPermanently.push(`${shop.name} (${shop.city})`);
    }

    await sleep(DELAY_MS);
  }

  console.log('\nRefresh Summary:');
  console.log(`Updated: ${updated}`);
  console.log(`No place_id (skipped): ${noPlaceId}`);
  console.log(`NOT_FOUND: ${notFound}`);
  console.log(`Other errors: ${otherErrors}`);
  console.log(`CLOSED_PERMANENTLY (${closedPermanently.length}):`);
  closedPermanently.forEach((s) => console.log(`  - ${s}`));

  if (cityArg) {
    const { rows } = await client.query(
      `SELECT name AS shop_name, rating AS rating_old, rating_refreshed, user_ratings_total_refreshed, google_business_status
       FROM shops
       WHERE city = $1 AND google_refreshed_at IS NOT NULL
       ORDER BY name`,
      [cityArg]
    );

    const escape = (val) => {
      if (val === null || val === undefined) return '';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const header = 'shop_name,rating_old,rating_refreshed,user_ratings_total_refreshed,google_business_status';
    const csvRows = rows.map((r) =>
      [r.shop_name, r.rating_old, r.rating_refreshed, r.user_ratings_total_refreshed, r.google_business_status]
        .map(escape)
        .join(',')
    );
    const filename = `${cityArg.toLowerCase().replace(/\s+/g, '-')}-google-refresh-review.csv`;
    fs.writeFileSync(filename, [header, ...csvRows].join('\n'), 'utf-8');
    console.log(`\nCSV exported: ${filename} (${rows.length} rows)`);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
