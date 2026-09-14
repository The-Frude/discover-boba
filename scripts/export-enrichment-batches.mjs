import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// One-time helper for the Sep 2026 content enrichment push (docs/
// discoverboba-seo-audit-plan-14sep2026.md Priority 1). Pulls every shop
// that still needs description_enriched, excludes permanently-closed
// shops (no point writing content we'll never show), parses each shop's
// `about` JSON into a clean, human-readable attribute list (same
// flattening logic as parseAboutAttributes() in src/utils/data.ts, since
// this is a standalone script with no shared import), and writes batch
// files of real per-shop data for subagents to write from - grounding
// every generated sentence in something true rather than inventing it.
//
// Usage: node scripts/export-enrichment-batches.mjs <output-dir> [batchSize]

dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const outDir = process.argv[2];
const batchSize = parseInt(process.argv[3] || '40', 10);

if (!outDir) {
  console.error('Usage: node scripts/export-enrichment-batches.mjs <output-dir> [batchSize]');
  process.exit(1);
}

function parseAboutAttributes(about) {
  const attributes = [];
  if (!about || about === '{}') return attributes;
  let parsed;
  try {
    parsed = JSON.parse(about);
  } catch {
    return attributes;
  }
  Object.values(parsed).forEach((items) => {
    if (!items || typeof items !== 'object') return;
    Object.entries(items).forEach(([name, value]) => {
      if (value === true) attributes.push(name);
    });
  });
  return [...new Set(attributes)];
}

function summarizeHours(workingHours) {
  if (!workingHours || typeof workingHours !== 'object') return null;
  const entries = Object.entries(workingHours);
  if (entries.length === 0) return null;
  // Just note whether hours vary by day or are consistent, plus one
  // sample - enough context for a writer without dumping a 7-line block
  // into every shop's data.
  const values = new Set(entries.map(([, v]) => v));
  if (values.size === 1) return `${entries[0][1]} every day`;
  return entries.map(([day, hours]) => `${day}: ${hours}`).join('; ');
}

async function main() {
  await client.connect();

  const { rows } = await client.query(`
    SELECT slug, name, formatted_address, city, state, tags, about,
           rating, user_ratings_total, working_hours, website
    FROM shops
    WHERE (description_enriched IS NULL OR trim(description_enriched) = '')
      AND google_business_status IS DISTINCT FROM 'CLOSED_PERMANENTLY'
    ORDER BY city, name
  `);

  console.log(`Found ${rows.length} shops needing enrichment.`);

  const shopData = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    address: r.formatted_address,
    city: r.city,
    state: r.state,
    // GENERIC_TAGS equivalents every shop has are noise - drop them so
    // writers see only what's actually distinguishing.
    distinguishing_tags: (r.tags || []).filter(
      (t) => !['Bubble Tea', 'Milk Tea', 'Tapioca Pearls', 'Boba', 'Takeout', 'Dine-in'].includes(t)
    ),
    real_attributes_from_google: parseAboutAttributes(r.about),
    rating: r.rating || null,
    review_count: r.user_ratings_total || null,
    hours_summary: summarizeHours(r.working_hours),
    has_website: Boolean(r.website),
  }));

  // Group by city, then split each city into batches so no single
  // subagent has to write 60-100 individually-differentiated
  // descriptions in one pass.
  const byCity = new Map();
  shopData.forEach((s) => {
    if (!byCity.has(s.city)) byCity.set(s.city, []);
    byCity.get(s.city).push(s);
  });

  fs.mkdirSync(outDir, { recursive: true });
  const manifest = [];

  for (const [city, shops] of byCity.entries()) {
    const numBatches = Math.ceil(shops.length / batchSize);
    for (let i = 0; i < numBatches; i++) {
      const batch = shops.slice(i * batchSize, (i + 1) * batchSize);
      const filename = `${city.toLowerCase().replace(/\s+/g, '-')}-batch-${i + 1}.json`;
      fs.writeFileSync(path.join(outDir, filename), JSON.stringify(batch, null, 2), 'utf-8');
      manifest.push({ city, batch: i + 1, count: batch.length, file: filename });
      console.log(`${city} batch ${i + 1}: ${batch.length} shops -> ${filename}`);
    }
  }

  fs.writeFileSync(path.join(outDir, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\nTotal: ${rows.length} shops across ${manifest.length} batch files in ${outDir}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
