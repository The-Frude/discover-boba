import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';

// Backfills latitude/longitude on existing `shops` rows from the source
// CSVs, which already contain coordinates that migrate-shops.mjs used to
// drop. Only touches latitude/longitude - no other columns are updated.

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

async function backfillCoordinates() {
  console.log('Starting shop coordinate backfill...');

  const dataDir = path.join(process.cwd(), 'data');
  const files = fs.readdirSync(dataDir).filter((file) => file.endsWith('.csv'));

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const cityName = path.basename(file, '.csv');
    const filePath = path.join(dataDir, file);
    console.log(`Processing ${cityName}...`);

    const rawData = await parseCSV(filePath);

    for (const item of rawData) {
      const slug = createSlug(item.name || '');
      const latitude = item.latitude ? parseFloat(item.latitude) : null;
      const longitude = item.longitude ? parseFloat(item.longitude) : null;

      if (!slug || latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
        console.warn(`Skipping ${item.name || '(unnamed)'} - missing slug or coordinates`);
        skipped++;
        continue;
      }

      const { data, error } = await supabaseAdmin
        .from('shops')
        .update({ latitude, longitude })
        .eq('slug', slug)
        .select('id');

      if (error) {
        console.error(`Error updating ${item.name} (${slug}):`, error);
        errors++;
      } else if (!data || data.length === 0) {
        console.warn(`No matching shop row for slug "${slug}" (${item.name}) - not in Supabase yet`);
        skipped++;
      } else {
        updated++;
      }
    }
  }

  console.log('\nBackfill Summary:');
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

backfillCoordinates();
