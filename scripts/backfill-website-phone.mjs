import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';

// migrate-shops.mjs read item.website / item.formatted_phone_number from
// the source CSVs, but the actual CSV column names are `site` and `phone`
// - so website/formatted_phone_number have been empty for every shop since
// the original migration. The data exists in the CSVs (97.8%/91.8%
// populated); this backfills it by slug, only setting non-empty values so
// nothing already correct gets overwritten.

dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
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
  console.log('Starting website/phone backfill...');

  const dataDir = path.join(process.cwd(), 'data');
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.csv'));

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const cityName = path.basename(file, '.csv');
    console.log(`Processing ${cityName}...`);
    const rows = await parseCSV(path.join(dataDir, file));

    for (const row of rows) {
      const slug = createSlug(row.name || '');
      if (!slug) {
        skipped++;
        continue;
      }

      const update = {};
      if (row.site?.trim()) update.website = row.site.trim();
      if (row.phone?.trim()) update.formatted_phone_number = row.phone.trim();

      if (Object.keys(update).length === 0) {
        skipped++;
        continue;
      }

      const { data, error } = await supabaseAdmin
        .from('shops')
        .update(update)
        .eq('slug', slug)
        .select('id');

      if (error) {
        console.error(`Error updating ${row.name} (${slug}):`, error);
        errors++;
      } else if (!data || data.length === 0) {
        skipped++;
      } else {
        updated++;
      }
    }
  }

  console.log('\nBackfill Summary:');
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (no data or no matching row): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
