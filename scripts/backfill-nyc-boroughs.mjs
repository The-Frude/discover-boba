import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import pg from 'pg';
import dotenv from 'dotenv';

// One-time backfill for the NYC borough pages phase of SEO audit Priority 5
// (docs/discoverboba-seo-audit-plan-14sep2026.md). Adds shops.borough and
// populates it for existing "New York" metro rows.
//
// Outscraper's own `borough` column in data/New York.csv is unreliable - it's
// really a Google "neighborhood" tag (fires for a handful of Queens
// neighborhoods, never says "Brooklyn"/"Bronx"/"Queens" outright, and is
// blank for ~90% of rows including all of Manhattan). ZIP code is a stable,
// well-documented way to classify NYC addresses by borough, so this derives
// borough from each row's postal_code instead.
//
// Matches CSV rows to existing DB rows via exact formatted_address equality -
// the same technique scripts/fix-duplicate-shop-slugs.mjs already used
// successfully (verified 145/145 exact matches, nothing has drifted since
// the original migration).
//
// Usage: node scripts/backfill-nyc-boroughs.mjs [--dry-run]

dotenv.config();

const isDryRun = process.argv.includes('--dry-run');

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Standard NYC ZIP-code-to-borough ranges (USPS/Census-stable, not derived
// from Outscraper's own inconsistent geocoding).
function boroughFromZip(zip) {
  if (!zip) return null;
  const z = parseInt(String(zip).trim().slice(0, 5), 10);
  if (!Number.isFinite(z)) return null;
  if (z >= 10001 && z <= 10282) return 'Manhattan';
  if (z >= 10451 && z <= 10475) return 'Bronx';
  if (z >= 10301 && z <= 10314) return 'Staten Island';
  if (z >= 11201 && z <= 11256) return 'Brooklyn';
  if (
    (z >= 11001 && z <= 11005) ||
    (z >= 11101 && z <= 11109) ||
    (z >= 11351 && z <= 11499) ||
    (z >= 11351 && z <= 11362) ||
    (z >= 11365 && z <= 11379) ||
    (z >= 11385 && z <= 11436)
  ) {
    return 'Queens';
  }
  return null; // outside the 5 boroughs (Long Island, NJ, upstate, etc.)
}

async function parseCSV(filePath) {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function main() {
  console.log(`Starting NYC borough backfill${isDryRun ? ' (DRY RUN)' : ''}...`);

  await client.connect();

  // Adding a nullable column is non-destructive - safe to run even in
  // dry-run mode, and required either way for the SELECT below to work.
  await client.query('ALTER TABLE shops ADD COLUMN IF NOT EXISTS borough text');

  const csvPath = path.join(process.cwd(), 'data', 'New York.csv');
  const rows = await parseCSV(csvPath);
  console.log(`CSV rows: ${rows.length}`);

  const counts = {};
  let matched = 0;
  let noAddress = 0;
  let noMatch = 0;
  let noBorough = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    const address = (row.full_address || '').trim();
    if (!address) {
      noAddress++;
      continue;
    }

    const borough = boroughFromZip(row.postal_code);
    if (!borough) {
      noBorough++;
      continue;
    }

    const { rows: existing } = await client.query(
      'SELECT id, borough FROM shops WHERE formatted_address = $1',
      [address]
    );

    if (existing.length === 0) {
      noMatch++;
      console.warn(`No DB match for "${row.name}" (${address})`);
      continue;
    }

    matched++;
    counts[borough] = (counts[borough] || 0) + 1;

    const shop = existing[0];
    if (shop.borough === borough) continue; // already set, idempotent re-run

    if (isDryRun) {
      console.log(`[DRY RUN] Would set borough="${borough}" for "${row.name}" (${address})`);
      continue;
    }

    try {
      await client.query('UPDATE shops SET borough = $1 WHERE id = $2', [borough, shop.id]);
      updated++;
    } catch (e) {
      console.error(`Error updating "${row.name}":`, e.message);
      errors++;
    }
  }

  console.log('\nPer-borough matched counts (from this CSV):');
  for (const [borough, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${borough}: ${count}`);
  }
  console.log(`\nMatched to a DB row: ${matched}`);
  console.log(`No usable ZIP / outside the 5 boroughs: ${noBorough}`);
  console.log(`No address in CSV row: ${noAddress}`);
  console.log(`No DB match found: ${noMatch}`);
  console.log(isDryRun ? 'Dry run - no writes performed.' : `Rows updated: ${updated}`);
  console.log(`Errors: ${errors}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
