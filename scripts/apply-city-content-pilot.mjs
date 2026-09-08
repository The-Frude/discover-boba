import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

// Generalized version of apply-atlanta-content-pilot.mjs - applies a
// per-city batch of meta_title/meta_description (all shops) and
// description_enriched (Tier A shops only), authored per
// discoverboba-shop-content-update-08sep2026.md Steps 2-3, then exports
// a review CSV for that city.
//
// Usage: node scripts/apply-city-content-pilot.mjs "<City>" <content.json> <output.csv>

dotenv.config();

const [, , cityArg, contentPathArg, csvPathArg] = process.argv;

if (!cityArg || !contentPathArg || !csvPathArg) {
  console.error('Usage: node scripts/apply-city-content-pilot.mjs "<City>" <content.json> <output.csv>');
  process.exit(1);
}

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const content = JSON.parse(fs.readFileSync(contentPathArg, 'utf-8'));

  await client.connect();

  let updated = 0;
  let errors = 0;

  for (const [slug, fields] of Object.entries(content)) {
    try {
      const result = await client.query(
        `UPDATE shops
         SET meta_title = $1,
             meta_description = $2,
             description_enriched = $3,
             content_generated_at = now()
         WHERE slug = $4 AND city = $5`,
        [fields.meta_title, fields.meta_description, fields.description_enriched || null, slug, cityArg]
      );
      if (result.rowCount === 0) {
        console.warn(`No matching row for slug "${slug}" in city "${cityArg}"`);
        errors++;
      } else {
        updated++;
      }
    } catch (e) {
      console.error(`Error updating ${slug}:`, e.message);
      errors++;
    }
  }

  console.log(`[${cityArg}] Updated: ${updated}, Errors: ${errors}`);

  const res = await client.query(
    `SELECT name AS shop_name, city, meta_title, meta_description, description_enriched
     FROM shops
     WHERE city = $1 AND content_generated_at IS NOT NULL
     ORDER BY name`,
    [cityArg]
  );

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const header = 'shop_name,city,meta_title,meta_description,description_enriched';
  const rows = res.rows.map(r =>
    [r.shop_name, r.city, r.meta_title, r.meta_description, r.description_enriched]
      .map(escape)
      .join(',')
  );
  fs.writeFileSync(csvPathArg, [header, ...rows].join('\n'), 'utf-8');
  console.log(`[${cityArg}] CSV exported: ${csvPathArg} (${res.rows.length} rows)`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
