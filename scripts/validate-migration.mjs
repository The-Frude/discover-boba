import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Function to create a slug from a string
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
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

// Main validation function
async function validateMigration() {
  try {
    console.log('Starting migration validation...');
    
    // Validate shops
    console.log('\nValidating shops...');
    
    // Get all CSV files from the data directory
    const dataDir = path.join(process.cwd(), 'data');
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));
    
    let totalShops = 0;
    let matchedShops = 0;
    let mismatchedShops = 0;
    let missingShops = 0;
    
    // Process each CSV file
    for (const file of files) {
      const cityName = path.basename(file, '.csv');
      const filePath = path.join(dataDir, file);
      
      console.log(`Validating shops for ${cityName}...`);
      
      try {
        // Parse the CSV file
        const rawData = await parseCSV(filePath);
        totalShops += rawData.length;
        
        // Process each shop
        for (const item of rawData) {
          const name = item.name || '';
          const slug = createSlug(name);
          
          // Check if the shop exists in Supabase
          const { data, error } = await supabase
            .from('shops')
            .select('name, slug, rating')
            .eq('slug', slug)
            .single();
            
          if (error) {
            console.error(`Shop not found in database: ${name} (${slug})`);
            missingShops++;
          } else {
            // Check if the data matches
            const csvRating = parseFloat(item.rating) || 0;
            const dbRating = data.rating;
            
            if (Math.abs(csvRating - dbRating) > 0.1) {
              console.error(`Rating mismatch for ${name}: CSV=${csvRating}, DB=${dbRating}`);
              mismatchedShops++;
            } else {
              matchedShops++;
            }
          }
        }
      } catch (cityError) {
        console.error(`Error validating city ${cityName}:`, cityError);
      }
    }
    
    // Validate reviews
    console.log('\nValidating reviews...');
    
    // Get all JSON files from the reviews directory
    const reviewsDir = path.join(process.cwd(), 'data', 'reviews');
    
    if (!fs.existsSync(reviewsDir)) {
      console.log('Reviews directory does not exist. Skipping review validation.');
    } else {
      const reviewFiles = fs.readdirSync(reviewsDir).filter(file => file.endsWith('.json'));
      
      let totalReviews = 0;
      let matchedReviews = 0;
      let mismatchedReviews = 0;
      let missingReviews = 0;
      
      // Process each JSON file
      for (const file of reviewFiles) {
        const shopSlug = path.basename(file, '.json');
        const filePath = path.join(reviewsDir, file);
        
        console.log(`Validating reviews for shop: ${shopSlug}...`);
        
        try {
          // Read the JSON file
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const reviews = JSON.parse(fileContent);
          
          totalReviews += reviews.length;
          
          // Process each review
          for (const review of reviews) {
            // Check if the review exists in Supabase
            const { data, error } = await supabase
              .from('reviews')
              .select('id, rating, comment')
              .eq('id', review.id)
              .single();
              
            if (error) {
              console.error(`Review not found in database: ${review.id}`);
              missingReviews++;
            } else {
              // Check if the data matches
              if (data.rating !== review.rating || data.comment !== review.comment) {
                console.error(`Data mismatch for review ${review.id}`);
                mismatchedReviews++;
              } else {
                matchedReviews++;
              }
            }
          }
        } catch (fileError) {
          console.error(`Error validating file ${file}:`, fileError);
        }
      }
      
      console.log('\nReviews Validation Summary:');
      console.log(`Total reviews: ${totalReviews}`);
      console.log(`Matched: ${matchedReviews}`);
      console.log(`Mismatched: ${mismatchedReviews}`);
      console.log(`Missing: ${missingReviews}`);
    }
    
    console.log('\nShops Validation Summary:');
    console.log(`Total shops: ${totalShops}`);
    console.log(`Matched: ${matchedShops}`);
    console.log(`Mismatched: ${mismatchedShops}`);
    console.log(`Missing: ${missingShops}`);
    
    if (mismatchedShops > 0 || missingShops > 0) {
      console.log('\nWarning: Some shops were not migrated correctly. Check the logs for details.');
    } else {
      console.log('\nAll shops were migrated successfully!');
    }
  } catch (error) {
    console.error('Validation failed:', error);
  }
}

// Run the validation
validateMigration();
