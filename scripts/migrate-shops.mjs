import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to create a slug from a string
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

// Function to extract tags from the about field
function extractTags(aboutField) {
  try {
    // Default tags that are common for boba shops
    const defaultTags = [
      'Bubble Tea', 
      'Milk Tea', 
      'Tapioca Pearls', 
      'Boba', 
      'Takeout', 
      'Dine-in'
    ];
    
    // If the about field is empty or invalid, return default tags
    if (!aboutField || aboutField === '{}') {
      return defaultTags;
    }
    
    // Extract tags using regular expressions
    const tags = [];
    
    // Common service options
    const serviceOptions = [
      'Takeout', 'Dine-in', 'Delivery', 'Curbside pickup',
      'No-contact delivery', 'Outdoor seating', 'Indoor seating'
    ];
    
    // Common features
    const features = [
      'Free Wi-Fi', 'Family-friendly', 'Vegetarian options',
      'Vegan options', 'Gluten-free options', 'Organic',
      'Accepts credit cards', 'Parking available', 'Wheelchair accessible'
    ];
    
    // Check for service options and features in the about field
    [...serviceOptions, ...features].forEach(option => {
      if (aboutField.includes(option) || 
          aboutField.toLowerCase().includes(option.toLowerCase())) {
        tags.push(option);
      }
    });
    
    // Add some boba-specific tags based on the about field content
    if (aboutField.toLowerCase().includes('fruit')) tags.push('Fruit Teas');
    if (aboutField.toLowerCase().includes('matcha')) tags.push('Matcha');
    if (aboutField.toLowerCase().includes('taro')) tags.push('Taro');
    if (aboutField.toLowerCase().includes('coffee')) tags.push('Coffee');
    if (aboutField.toLowerCase().includes('smoothie')) tags.push('Smoothies');
    if (aboutField.toLowerCase().includes('slush')) tags.push('Slushies');
    
    // Combine with default tags and remove duplicates
    return [...new Set([...defaultTags, ...tags])];
  } catch (error) {
    console.error('Error extracting tags:', error);
    return [];
  }
}

// Function to extract city and state from formatted_address
function extractCityState(formattedAddress) {
  try {
    const parts = formattedAddress.split(' ');
    const state = parts[parts.length - 2];
    const city = parts[parts.length - 3];
    return { city, state };
  } catch (error) {
    console.error('Error extracting city and state:', error);
    return { city: '', state: '' };
  }
}

// Function to parse CSV data
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

// Main migration function
async function migrateShops() {
  try {
    console.log('Starting shops migration...');
    
    // Get all CSV files from the data directory
    const dataDir = path.join(process.cwd(), 'data');
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));
    
    let totalShops = 0;
    let migratedShops = 0;
    let errorShops = 0;
    
    // Process each CSV file
    for (const file of files) {
      const cityName = path.basename(file, '.csv');
      const filePath = path.join(dataDir, file);
      
      console.log(`Processing ${cityName}...`);
      
      try {
        // Parse the CSV file
        const rawData = await parseCSV(filePath);
        totalShops += rawData.length;
        
        // Process each shop
        for (const item of rawData) {
          try {
            const address = item.full_address || item.formatted_address || '';
            const { city, state } = extractCityState(address);
            
            // Handle working hours
            let workingHours = null;
            if (item.working_hours) {
              try {
                workingHours = typeof item.working_hours === 'string' 
                  ? JSON.parse(item.working_hours.replace(/'/g, '"'))
                  : item.working_hours;
              } catch (e) {
                console.error('Error parsing working_hours:', e);
              }
            } else if (item.working_hours_old_format) {
              try {
                const hoursArray = item.working_hours_old_format.split('|');
                const hoursObj = {};
                hoursArray.forEach((hour) => {
                  const [day, time] = hour.split(':');
                  hoursObj[day] = time;
                });
                workingHours = hoursObj;
              } catch (e) {
                console.error('Error parsing working_hours_old_format:', e);
              }
            }
            
            // Extract tags
            const tags = extractTags(item.about || '{}');
            
            // Create slug
            const slug = createSlug(item.name || '');
            
            // Prepare shop data
            const shopData = {
              name: item.name || '',
              slug: slug,
              formatted_address: address,
              city: cityName, // Use the filename as the city
              state: state,
              rating: parseFloat(item.rating) || 0,
              user_ratings_total: parseInt(item.user_ratings_total) || 0,
              reviews_link: item.reviews_link || '',
              website: item.website || '',
              formatted_phone_number: item.formatted_phone_number || '',
              email: item.email_1 || '',
              working_hours: workingHours,
              menu_link: item.menu_link || '',
              order_links: item.order_links || '',
              photos: item.photos ? [item.photos] : [],
              tags: tags,
              about: item.about || '',
              is_premium: false,
              featured_until: null,
              featured_logo: null
            };
            
            // Insert shop into Supabase
            const { data, error } = await supabaseAdmin
              .from('shops')
              .upsert(shopData, { onConflict: 'slug' })
              .select('id, slug');
              
            if (error) {
              console.error(`Error inserting shop ${item.name}:`, error);
              errorShops++;
            } else {
              console.log(`Migrated shop: ${item.name} (${data[0].slug})`);
              migratedShops++;
            }
          } catch (shopError) {
            console.error(`Error processing shop ${item.name}:`, shopError);
            errorShops++;
          }
        }
      } catch (cityError) {
        console.error(`Error processing city ${cityName}:`, cityError);
      }
    }
    
    console.log('\nMigration Summary:');
    console.log(`Total shops: ${totalShops}`);
    console.log(`Successfully migrated: ${migratedShops}`);
    console.log(`Errors: ${errorShops}`);
    
    if (errorShops > 0) {
      console.log('\nWarning: Some shops were not migrated successfully. Check the logs for details.');
    } else {
      console.log('\nAll shops migrated successfully!');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateShops();
