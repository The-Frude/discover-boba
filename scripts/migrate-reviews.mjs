import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Main migration function
async function migrateReviews() {
  try {
    console.log('Starting reviews migration...');
    
    // Get all JSON files from the reviews directory
    const reviewsDir = path.join(process.cwd(), 'data', 'reviews');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(reviewsDir)) {
      console.log('Reviews directory does not exist. No reviews to migrate.');
      return;
    }
    
    const files = fs.readdirSync(reviewsDir).filter(file => file.endsWith('.json'));
    
    let totalReviews = 0;
    let migratedReviews = 0;
    let errorReviews = 0;
    
    // Process each JSON file
    for (const file of files) {
      const shopSlug = path.basename(file, '.json');
      const filePath = path.join(reviewsDir, file);
      
      console.log(`Processing reviews for shop: ${shopSlug}...`);
      
      try {
        // Read the JSON file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const reviews = JSON.parse(fileContent);
        
        totalReviews += reviews.length;
        
        // Get the shop ID from Supabase
        const { data: shopData, error: shopError } = await supabaseAdmin
          .from('shops')
          .select('id')
          .eq('slug', shopSlug)
          .single();
          
        if (shopError) {
          console.error(`Error finding shop with slug ${shopSlug}:`, shopError);
          errorReviews += reviews.length;
          continue;
        }
        
        const shopId = shopData.id;
        
        // Process each review
        for (const review of reviews) {
          try {
            // Prepare review data
            const reviewData = {
              id: review.id, // Keep the original UUID
              shop_id: shopId,
              shop_slug: shopSlug,
              user_name: review.userName,
              user_email: review.userEmail,
              rating: review.rating,
              comment: review.comment,
              date: review.date,
              is_verified: review.isVerified,
              is_approved: review.isApproved,
              created_at: review.date, // Use the original date
              updated_at: review.date
            };
            
            // Insert review into Supabase
            const { error } = await supabaseAdmin
              .from('reviews')
              .upsert(reviewData, { onConflict: 'id' });
              
            if (error) {
              console.error(`Error inserting review ${review.id}:`, error);
              errorReviews++;
            } else {
              console.log(`Migrated review: ${review.id}`);
              migratedReviews++;
            }
          } catch (reviewError) {
            console.error(`Error processing review ${review.id}:`, reviewError);
            errorReviews++;
          }
        }
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
      }
    }
    
    console.log('\nReviews Migration Summary:');
    console.log(`Total reviews: ${totalReviews}`);
    console.log(`Successfully migrated: ${migratedReviews}`);
    console.log(`Errors: ${errorReviews}`);
    
    if (errorReviews > 0) {
      console.log('\nWarning: Some reviews were not migrated successfully. Check the logs for details.');
    } else {
      console.log('\nAll reviews migrated successfully!');
    }
  } catch (error) {
    console.error('Reviews migration failed:', error);
  }
}

// Run the migration
migrateReviews();
