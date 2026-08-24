import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';

// migrate-shops.mjs derives every shop's slug from its NAME ONLY and
// upserts onConflict:'slug' - so any two CSV rows sharing an identical
// shop name (chain locations) collapse onto a single Supabase row, with
// the last one processed silently winning. This script recovers the
// locations that were never inserted by giving them a disambiguated slug
// (name + the CSV row's own true locality), without touching any slug
// that's already unique and live.
//
// Safe to re-run: a physical location is considered "already represented"
// by an exact formatted_address match, regardless of which slug it lives
// under, so a location this script already inserted under a disambiguated
// slug in a prior run is correctly skipped on the next run.

dotenv.config();

const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

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

function extractTags(aboutField) {
  try {
    const defaultTags = [
      'Bubble Tea',
      'Milk Tea',
      'Tapioca Pearls',
      'Boba',
      'Takeout',
      'Dine-in'
    ];

    if (!aboutField || aboutField === '{}') {
      return defaultTags;
    }

    const tags = [];

    const serviceOptions = [
      'Takeout', 'Dine-in', 'Delivery', 'Curbside pickup',
      'No-contact delivery', 'Outdoor seating', 'Indoor seating'
    ];

    const features = [
      'Free Wi-Fi', 'Family-friendly', 'Vegetarian options',
      'Vegan options', 'Gluten-free options', 'Organic',
      'Accepts credit cards', 'Parking available', 'Wheelchair accessible'
    ];

    [...serviceOptions, ...features].forEach(option => {
      if (aboutField.includes(option) ||
          aboutField.toLowerCase().includes(option.toLowerCase())) {
        tags.push(option);
      }
    });

    if (aboutField.toLowerCase().includes('fruit')) tags.push('Fruit Teas');
    if (aboutField.toLowerCase().includes('matcha')) tags.push('Matcha');
    if (aboutField.toLowerCase().includes('taro')) tags.push('Taro');
    if (aboutField.toLowerCase().includes('coffee')) tags.push('Coffee');
    if (aboutField.toLowerCase().includes('smoothie')) tags.push('Smoothies');
    if (aboutField.toLowerCase().includes('slush')) tags.push('Slushies');

    return [...new Set([...defaultTags, ...tags])];
  } catch (error) {
    console.error('Error extracting tags:', error);
    return [];
  }
}

function extractCityState(formattedAddress) {
  try {
    const parts = formattedAddress.split(' ');
    const state = parts[parts.length - 2];
    return { state };
  } catch (error) {
    console.error('Error extracting state:', error);
    return { state: '' };
  }
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

async function slugExists(slug, claimedSlugsThisRun) {
  if (claimedSlugsThisRun.has(slug)) return true;
  const { data, error } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('slug', slug)
    .limit(1);
  if (error) throw error;
  return Boolean(data && data.length > 0);
}

async function main() {
  console.log(`Starting duplicate-slug fix${isDryRun ? ' (DRY RUN)' : ''}...`);

  const dataDir = path.join(process.cwd(), 'data');
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.csv'));

  const allRows = [];
  for (const file of files) {
    const metroCity = path.basename(file, '.csv');
    const rawData = await parseCSV(path.join(dataDir, file));
    for (const row of rawData) allRows.push({ metroCity, row });
  }

  const groups = new Map();
  for (const entry of allRows) {
    const baseSlug = createSlug(entry.row.name || '');
    if (!baseSlug) continue;
    if (!groups.has(baseSlug)) groups.set(baseSlug, []);
    groups.get(baseSlug).push(entry);
  }

  const collidingGroups = [...groups.entries()].filter(([, rows]) => rows.length > 1);

  console.log(`Total CSV rows: ${allRows.length}`);
  console.log(`Unique base slugs: ${groups.size}`);
  console.log(`Colliding name groups (2+ rows): ${collidingGroups.length}`);

  let alreadyRepresented = 0;
  let inserted = 0;
  let wouldInsert = 0;
  let errors = 0;

  const claimedSlugsThisRun = new Set();

  for (const [baseSlug, rows] of collidingGroups) {
    for (const { metroCity, row } of rows) {
      const address = (row.full_address || row.formatted_address || '').trim();
      if (!address) {
        console.warn(`Skipping "${row.name}" - no address, cannot dedupe safely`);
        errors++;
        continue;
      }

      const { data: existingByAddress, error: lookupErr } = await supabaseAdmin
        .from('shops')
        .select('id, slug')
        .eq('formatted_address', address)
        .limit(1);

      if (lookupErr) {
        console.error(`Lookup error for "${row.name}" (${address}):`, lookupErr);
        errors++;
        continue;
      }

      if (existingByAddress && existingByAddress.length > 0) {
        alreadyRepresented++;
        continue;
      }

      const rowCity = (row.city || metroCity || '').trim();
      const citySlugPart = createSlug(rowCity) || 'shop';
      let candidateSlug = `${baseSlug}-${citySlugPart}`;

      try {
        if (await slugExists(candidateSlug, claimedSlugsThisRun)) {
          let n = 2;
          let fallbackSlug = `${candidateSlug}-${n}`;
          while (await slugExists(fallbackSlug, claimedSlugsThisRun)) {
            n++;
            fallbackSlug = `${candidateSlug}-${n}`;
          }
          candidateSlug = fallbackSlug;
        }
      } catch (e) {
        console.error(`Slug-availability check failed for "${row.name}":`, e);
        errors++;
        continue;
      }

      claimedSlugsThisRun.add(candidateSlug);

      const { state } = extractCityState(address);

      let workingHours = null;
      if (row.working_hours) {
        try {
          workingHours = typeof row.working_hours === 'string'
            ? JSON.parse(row.working_hours.replace(/'/g, '"'))
            : row.working_hours;
        } catch (e) {
          console.error('Error parsing working_hours:', e);
        }
      } else if (row.working_hours_old_format) {
        try {
          const hoursObj = {};
          row.working_hours_old_format.split('|').forEach((h) => {
            const [day, time] = h.split(':');
            hoursObj[day] = time;
          });
          workingHours = hoursObj;
        } catch (e) {
          console.error('Error parsing working_hours_old_format:', e);
        }
      }

      const shopData = {
        name: row.name || '',
        slug: candidateSlug,
        formatted_address: address,
        city: metroCity,
        state,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        rating: parseFloat(row.rating) || 0,
        user_ratings_total: parseInt(row.user_ratings_total) || 0,
        reviews_link: row.reviews_link || '',
        website: row.website || '',
        formatted_phone_number: row.formatted_phone_number || '',
        email: row.email_1 || '',
        working_hours: workingHours,
        menu_link: row.menu_link || '',
        order_links: row.order_links || '',
        photos: row.photo ? [row.photo] : [],
        tags: extractTags(row.about || '{}'),
        about: row.about || '',
        is_premium: false,
        featured_until: null,
        featured_logo: null,
        description: (row.description || '').trim(),
        reservation_links: (row.reservation_links || '').trim(),
        booking_appointment_link: (row.booking_appointment_link || '').trim(),
        facebook: (row.facebook || '').trim(),
        instagram: (row.instagram || '').trim(),
        twitter: (row.twitter || '').trim(),
        tiktok: (row.tiktok || '').trim(),
      };

      if (isDryRun) {
        console.log(`[DRY RUN] Would insert: "${shopData.name}" | slug=${shopData.slug} | city=${shopData.city} | address=${shopData.formatted_address}`);
        wouldInsert++;
        continue;
      }

      const { error: insertErr } = await supabaseAdmin
        .from('shops')
        .insert(shopData)
        .select('id, slug');

      if (insertErr) {
        console.error(`Error inserting "${shopData.name}" (${shopData.slug}):`, insertErr);
        errors++;
      } else {
        console.log(`Inserted: "${shopData.name}" (${shopData.slug})`);
        inserted++;
      }
    }
  }

  console.log('\nFix Summary:');
  console.log(`Colliding name groups: ${collidingGroups.length}`);
  console.log(`Rows already represented in DB (skipped): ${alreadyRepresented}`);
  console.log(isDryRun ? `Rows that would be inserted: ${wouldInsert}` : `Rows inserted: ${inserted}`);
  console.log(`Errors: ${errors}`);
}

main();
