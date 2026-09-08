import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

// Applies the Atlanta pilot batch of meta_title/meta_description
// (all shops) and description_enriched (Tier A shops only) from
// scratch-atlanta-content.json, authored per
// discoverboba-shop-content-update-08sep2026.md Steps 2-3.
// Sets content_generated_at so processed rows are distinguishable from
// not-yet-processed ones and this script can be safely re-run.

dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const content = JSON.parse(fs.readFileSync('scratch-atlanta-content.json', 'utf-8'));

  await client.connect();

  let updated = 0;
  let errors = 0;

  for (const [slug, fields] of Object.entries(content)) {
    try {
      await client.query(
        `UPDATE shops
         SET meta_title = $1,
             meta_description = $2,
             description_enriched = $3,
             content_generated_at = now()
         WHERE slug = $4`,
        [fields.meta_title, fields.meta_description, fields.description_enriched || null, slug]
      );
      updated++;
    } catch (e) {
      console.error(`Error updating ${slug}:`, e.message);
      errors++;
    }
  }

  console.log(`Updated: ${updated}, Errors: ${errors}`);

  // Export the CSV for review, per Step 5.
  const res = await client.query(
    `SELECT name AS shop_name, city, meta_title, meta_description, description_enriched
     FROM shops
     WHERE city = 'Atlanta' AND content_generated_at IS NOT NULL
     ORDER BY name`
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
  fs.writeFileSync('atlanta-content-pilot-review.csv', [header, ...rows].join('\n'), 'utf-8');
  console.log(`CSV exported: atlanta-content-pilot-review.csv (${res.rows.length} rows)`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
