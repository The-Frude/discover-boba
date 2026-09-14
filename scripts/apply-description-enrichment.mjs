import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

// Applies one batch of generated description_enriched content (Sep 2026
// content push, docs/discoverboba-seo-audit-plan-14sep2026.md Priority 1).
// Deliberately narrower than apply-city-content-pilot.mjs: this round only
// fills description_enriched - all 516 target shops already have
// meta_title/meta_description from the original Sep 8 initiative, so
// those are left untouched rather than regenerated.
//
// Input: a JSON file mapping slug -> description string, e.g.
//   { "some-shop-slug": "Some Shop is a ...", ... }
//
// Usage: node scripts/apply-description-enrichment.mjs <content.json>

dotenv.config();

const [, , contentPathArg] = process.argv;

if (!contentPathArg) {
  console.error('Usage: node scripts/apply-description-enrichment.mjs <content.json>');
  process.exit(1);
}

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const content = JSON.parse(fs.readFileSync(contentPathArg, 'utf-8'));

  await client.connect();

  let updated = 0;
  let skippedAlreadyEnriched = 0;
  let errors = 0;

  for (const [slug, description] of Object.entries(content)) {
    if (!description || typeof description !== 'string' || !description.trim()) {
      console.warn(`Empty/invalid description for "${slug}" - skipped`);
      errors++;
      continue;
    }
    try {
      // Only fill genuinely-empty rows - a batch re-run should never
      // clobber content another batch (or a human edit) already applied.
      const result = await client.query(
        `UPDATE shops
         SET description_enriched = $1,
             content_generated_at = now()
         WHERE slug = $2
           AND (description_enriched IS NULL OR trim(description_enriched) = '')`,
        [description.trim(), slug]
      );
      if (result.rowCount === 0) {
        const { rows } = await client.query('SELECT 1 FROM shops WHERE slug = $1', [slug]);
        if (rows.length === 0) {
          console.warn(`No shop found for slug "${slug}"`);
          errors++;
        } else {
          skippedAlreadyEnriched++;
        }
      } else {
        updated++;
      }
    } catch (e) {
      console.error(`Error updating ${slug}:`, e.message);
      errors++;
    }
  }

  console.log(`\n${contentPathArg}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already had a description_enriched): ${skippedAlreadyEnriched}`);
  console.log(`Errors: ${errors}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
