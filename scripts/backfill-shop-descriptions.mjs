import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';

// Backfills description, reservation links, and social handles on existing
// `shops` rows from the source CSVs - columns migrate-shops.mjs never
// carried over. Run scripts/add-description-and-links-to-shops.sql first.
// Only touches columns that have a non-empty value in the CSV row; existing
// data already on the row is never blanked out.

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

async function backfillDescriptions() {
  console.log('Starting shop description/link backfill...');

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
      if (!slug) {
        skipped++;
        continue;
      }

      const update = {};
      if (item.description?.trim()) update.description = item.description.trim();
      if (item.reservation_links?.trim()) update.reservation_links = item.reservation_links.trim();
      if (item.booking_appointment_link?.trim()) update.booking_appointment_link = item.booking_appointment_link.trim();
      if (item.facebook?.trim()) update.facebook = item.facebook.trim();
      if (item.instagram?.trim()) update.instagram = item.instagram.trim();
      if (item.twitter?.trim()) update.twitter = item.twitter.trim();
      if (item.tiktok?.trim()) update.tiktok = item.tiktok.trim();

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

backfillDescriptions();
