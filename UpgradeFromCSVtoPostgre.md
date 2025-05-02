# Comprehensive Plan: CSV to PostgreSQL Migration

## Goal
Replace the current static CSV-based data system (stored in `/data/*.csv`) and JSON-based reviews (stored in `/data/reviews/*.json`) with Supabase as a central PostgreSQL database. Maintain the static generation of individual city pages, but use Supabase queries instead of reading files.

---

## 1. Database Architecture

### 1.1 Supabase Setup

- Create a Supabase project at [https://supabase.com](https://supabase.com)
- Add the following environment variables to `.env` and `.env.example`:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Update CSP to allow Supabase connections
NEXT_PUBLIC_CSP_CONNECT_SRC="${NEXT_PUBLIC_CSP_CONNECT_SRC} https://*.supabase.co"
```

### 1.2 Database Schema

Create the following tables in Supabase:

#### Shops Table

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shops Table
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  formatted_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  rating DECIMAL(3,1) NOT NULL DEFAULT 0,
  user_ratings_total INTEGER NOT NULL DEFAULT 0,
  reviews_link TEXT,
  website TEXT,
  formatted_phone_number VARCHAR(50),
  email VARCHAR(255),
  working_hours JSONB,
  menu_link TEXT,
  order_links TEXT,
  photos JSONB,
  tags TEXT[],
  about TEXT,
  
  -- Premium features
  is_premium BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP WITH TIME ZONE,
  featured_logo TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexing
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Create indexes for performance
CREATE INDEX idx_shops_city ON shops(city);
CREATE INDEX idx_shops_slug ON shops(slug);
CREATE INDEX idx_shops_tags ON shops USING GIN(tags);
CREATE INDEX idx_shops_is_premium ON shops(is_premium) WHERE is_premium = TRUE;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_shops_updated_at
BEFORE UPDATE ON shops
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### Reviews Table

```sql
-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shop_slug VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_review_rating CHECK (rating >= 1 AND rating <= 5)
);

-- Create indexes for performance
CREATE INDEX idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX idx_reviews_shop_slug ON reviews(shop_slug);
CREATE INDEX idx_reviews_is_approved ON reviews(is_approved);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 1.3 Row-Level Security (RLS) Policies

Implement Row-Level Security to control access to the data:

```sql
-- Enable Row Level Security
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for shops
CREATE POLICY "Public shops are viewable by everyone"
  ON shops FOR SELECT
  USING (TRUE);

CREATE POLICY "Shops can only be inserted by authenticated users with admin role"
  ON shops FOR INSERT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Shops can only be updated by authenticated users with admin role"
  ON shops FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Shops can only be deleted by authenticated users with admin role"
  ON shops FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for reviews
CREATE POLICY "Approved reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (is_approved = TRUE);

CREATE POLICY "All reviews are viewable by admins"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Reviews can be inserted by anyone"
  ON reviews FOR INSERT
  USING (TRUE);

CREATE POLICY "Reviews can only be updated by admins"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Reviews can only be deleted by admins"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 2. Migration Strategy

### 2.1 Dependencies Installation

Install the required dependencies:

```bash
npm install @supabase/supabase-js pg dotenv
```

### 2.2 Migration Scripts

Create the following migration scripts:

#### 2.2.1 Shops Migration Script (`scripts/migrate-shops.mjs`)

```javascript
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';
import { createSlug, extractTags } from '../src/utils/data.js';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
```

#### 2.2.2 Reviews Migration Script (`scripts/migrate-reviews.mjs`)

```javascript
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
```

#### 2.2.3 Validation Script (`scripts/validate-migration.mjs`)

```javascript
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';
import { createSlug } from '../src/utils/data.js';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
```

#### 2.2.4 Rollback Script (`scripts/rollback-migration.mjs`)

```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for confirmation
function confirm(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main rollback function
async function rollbackMigration() {
  try {
    console.log('WARNING: This will delete ALL data from the Supabase database!');
    console.log('This action cannot be undone.');
    
    const confirmed = await confirm('Are you sure you want to proceed? (y/n): ');
    
    if (!confirmed) {
      console.log('Rollback cancelled.');
      rl.close();
      return;
    }
    
    console.log('Starting rollback...');
    
    // Delete all reviews first (due to foreign key constraints)
    console.log('Deleting all reviews...');
    const { error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
    if (reviewsError) {
      console.error('Error deleting reviews:', reviewsError);
    } else {
      console.log('All reviews deleted successfully.');
    }
    
    // Delete all shops
    console.log('Deleting all shops...');
    const { error: shopsError } = await supabaseAdmin
      .from('shops')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
    if (shopsError) {
      console.error('Error deleting shops:', shopsError);
    } else {
      console.log('All shops deleted successfully.');
    }
    
    console.log('Rollback completed successfully.');
  } catch (error) {
    console.error('Rollback failed:', error);
  } finally {
    rl.close();
  }
}

// Run the rollback
rollbackMigration();
```

### 2.3 Update package.json Scripts

Add these scripts to package.json:

```json
"scripts": {
  "migrate:shops": "node scripts/migrate-shops.mjs",
  "migrate:reviews": "node scripts/migrate-reviews.mjs",
  "migrate:validate": "node scripts/validate-migration.mjs",
  "migrate:rollback": "node scripts/rollback-migration.mjs",
  "migrate": "npm run migrate:shops && npm run migrate:reviews && npm run migrate:validate"
}
```

---

## 3. Application Updates

### 3.1 Supabase Client Setup (`src/utils/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Create an admin client for server-side operations
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};
```

### 3.2 TypeScript Types for Supabase (`src/types/supabase.ts`)

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string
          name: string
          slug: string
          formatted_address: string
          city: string
          state: string
          rating: number
          user_ratings_total: number
          reviews_link: string | null
          website: string | null
          formatted_phone_number: string | null
          email: string | null
          working_hours: Json | null
          menu_link: string | null
          order_links: string | null
          photos: Json | null
          tags: string[] | null
          about: string | null
          is_premium: boolean
          featured_until: string | null
          featured_logo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          formatted_address: string
          city: string
          state: string
          rating?: number
          user_ratings_total?: number
          reviews_link?: string | null
          website?: string | null
          formatted_phone_number?: string | null
          email?: string | null
          working_hours?: Json | null
          menu_link?: string | null
          order_links?: string | null
          photos?: Json | null
          tags?: string[] | null
          about?: string | null
          is_premium?: boolean
          featured_until?: string | null
          featured_logo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          formatted_address?: string
          city?: string
          state?: string
          rating?: number
          user_ratings_total?: number
          reviews_link?: string | null
          website?: string | null
          formatted_phone_number?: string | null
          email?: string | null
          working_hours?: Json | null
          menu_link?: string | null
          order_links?: string | null
          photos?: Json | null
          tags?: string[] | null
          about?: string | null
          is_premium?: boolean
          featured_until?: string | null
          featured_logo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          shop_id: string
          shop_slug: string
          user_name: string
          user_email: string
          rating: number
          comment: string
          date: string
          is_verified: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          shop_slug: string
          user_name: string
          user_email: string
          rating: number
          comment: string
          date?: string
          is_verified?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          shop_slug?: string
          user_name?: string
          user_email?: string
          rating?: number
          comment?: string
          date?: string
          is_verified?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
```

### 3.3 Updated Data Utility (`src/utils/data.ts`)

Replace the existing data.ts file with a new version that uses Supabase:

```typescript
import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

export interface Shop {
  id: string;
  name: string;
  formatted_address: string;
  city: string;
  state: string;
  rating: number;
  user_ratings_total: number;
  reviews?: number;
  reviews_link?: string;
  website?: string;
  formatted_phone_number?: string;
  opening_hours?: {
    weekday_text: string[];
  };
  working_hours?: any;
  photos?: string[];
  tags: string[];
  slug: string;
  email?: string;
  menu_link?: string;
  order_links?: string;
  is_premium?: boolean;
  featured_until?: string;
  featured_logo?: string;
}

export interface City {
  name: string;
  slug: string;
  state: string;
  shopCount: number;
  image?: string;
}

// Function to create a slug from a string
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

// Function to extract tags from the about field
export function extractTags(aboutField: string): string[] {
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
    const tags: string[] = [];
    
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

// Function to get all cities
export async function getCities(): Promise<City[]> {
  try {
    // Get all unique cities from the shops table
    const { data: cityData, error } = await supabase
      .from('shops')
      .select('city, state')
      .order('city');
      
    if (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
    
    // Count shops per city and create city objects
    const cities: City[] = [];
    const cityMap = new Map<string, { count: number, state: string }>();
    
    // Group by city and count shops
    for (const shop of cityData) {
      const cityName = shop.city;
      if (!cityMap.has(cityName)) {
        cityMap.set(cityName, { count: 1, state: shop.state });
      } else {
        const current = cityMap.get(cityName)!;
        cityMap.set(cityName, { count: current.count + 1, state: current.state });
      }
    }
    
    // Create city objects
    for (const [cityName, data] of cityMap.entries()) {
      // Check for city image
      let imagePath = `/images/${cityName}.jpg`; // Default path
      if (fs.existsSync(path.join(process.cwd(), 'public', 'images', `${cityName}.jpg`))) {
        imagePath = `/images/${cityName}.jpg`;
      } else if (fs.existsSync(path.join(process.cwd(), 'public', 'images', `${cityName}.JPG`))) {
        imagePath = `/images/${cityName}.JPG`;
      } else if (fs.existsSync(path.join(process.cwd(), 'public', 'images', `${cityName}.jpeg`))) {
        imagePath = `/images/${cityName}.jpeg`;
      } else if (fs.existsSync(path.join(process.cwd(), 'public', 'images', `${cityName}.PNG`))) {
        imagePath = `/images/${cityName}.PNG`;
      } else {
        imagePath = `/images/boba-cat.jpeg`; // Fallback image
      }
      
      cities.push({
        name: cityName,
        slug: createSlug(cityName),
        state: data.state,
        shopCount: data.count,
        image: imagePath,
      });
    }
    
    return cities;
  } catch (error) {
    console.error('Error getting cities:', error);
    return [];
  }
}

// Function to get shops by city
export async function getShopsByCity(cityName: string, sortBy = 'rating'): Promise<Shop[]> {
  try {
    // Determine sort order
    let sortField = 'rating';
    let ascending = false;
    
    switch(sortBy) {
      case 'rating': 
        sortField = 'rating';
        ascending = false;
        break;
      case 'reviews': 
        sortField = 'user_ratings_total';
        ascending = false;
        break;
      case 'name': 
        sortField = 'name';
        ascending = true;
        break;
      default: 
        sortField = 'rating';
        ascending = false;
    }
    
    // Add premium sorting (premium shops first, then by selected sort)
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('city', cityName)
      .order('is_premium', { ascending: false })
      .order(sortField, { ascending });
      
    if (error) {
      console.error(`Error getting shops for ${cityName}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error getting shops for ${cityName}:`, error);
    return [];
  }
}

// Function to get a shop by slug
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (error) {
      console.error(`Error getting shop with slug ${slug}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error getting shop with slug ${slug}:`, error);
    return null;
  }
}

// Function to get all tags across all shops
export async function getAllTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('tags');
      
    if (error) {
      console.error('Error getting tags:', error);
      return [];
    }
    
    // Flatten and deduplicate tags
    const allTags = new Set<string>();
    
    data.forEach(shop => {
      if (shop.tags) {
        shop.tags.forEach((tag: string) => {
          allTags.add(tag);
        });
      }
    });
    
    return Array.from(allTags);
  } catch (error) {
    console.error('Error getting tags:', error);
    return [];
  }
}
```

### 3.4 Updated Reviews Utility (`src/utils/reviews.ts`)

```typescript
import { supabase, createAdminClient } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface Review {
  id: string;
  shop_id: string;
  shop_slug: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  date: string;
  is_verified: boolean;
  is_approved: boolean;
}

// Function to get all reviews for a shop
export async function getReviewsByShopSlug(shopSlug: string): Promise<Review[]> {
  try {
    // For public access, only get approved reviews
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('shop_slug', shopSlug)
      .order('date', { ascending: false });
      
    if (error) {
      console.error(`Error getting reviews for ${shopSlug}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error getting reviews for ${shopSlug}:`, error);
    return [];
  }
}

// Function to add a new review for a shop
export async function addReview(review: Omit<Review, 'id' | 'date' | 'is_verified' | 'is_approved'>): Promise<Review> {
  try {
    // Get the shop ID
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('slug', review.shop_slug)
      .single();
      
    if (shopError) {
      console.error(`Error finding shop with slug ${review.shop_slug}:`, shopError);
      throw new Error('Failed to add review: Shop not found');
    }
    
    // Create a new review with additional fields
    const newReview: Omit<Review, 'id'> = {
      shop_id: shopData.id,
      shop_slug: review.shop_slug,
      user_name: review.user_name,
      user_email: review.user_email,
      rating: review.rating,
      comment: review.comment,
      date: new Date().toISOString(),
      is_verified: false, // In a real app, this would be set based on user authentication
      is_approved: process.env.REVIEW_MODERATION_ENABLED === 'true' ? false : true, // Auto-approve if moderation is disabled
    };
    
    // Insert the review
    const { data, error } = await supabase
      .from('reviews')
      .insert([newReview])
      .select()
      .single();
      
    if (error) {
      console.error(`Error adding review for ${review.shop_slug}:`, error);
      throw new Error('Failed to add review');
    }
    
    return data;
  } catch (error) {
    console.error(`Error adding review for ${review.shop_slug}:`, error);
    throw new Error('Failed to add review');
  }
}

// Function to get the average rating for a shop
export async function getAverageRating(shopSlug: string): Promise<{ average: number; count: number }> {
  try {
    // Only consider approved reviews for the average rating
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('shop_slug', shopSlug)
      .eq('is_approved', true);
      
    if (error) {
      console.error(`Error getting ratings for ${shopSlug}:`, error);
      return { average: 0, count: 0 };
    }
    
    if (data.length === 0) {
      return { average: 0, count: 0 };
    }
    
    const sum = data.reduce((total, review) => total + review.rating, 0);
    const average = sum / data.length;
    
    return {
      average: parseFloat(average.toFixed(1)),
      count: data.length,
    };
  } catch (error) {
    console.error(`Error getting average rating for ${shopSlug}:`, error);
    return { average: 0, count: 0 };
  }
}

// Function to delete a review (for moderation purposes)
export async function deleteReview(shopSlug: string, reviewId: string): Promise<boolean> {
  try {
    // Use admin client for moderation operations
    const supabaseAdmin = createAdminClient();
    
    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('shop_slug', shopSlug);
      
    if (error) {
      console.error(`Error deleting review ${reviewId} for ${shopSlug}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting review ${reviewId} for ${shopSlug}:`, error);
    return false;
  }
}

// Function to update a review's approval status (for moderation purposes)
export async function updateReviewApproval(shopSlug: string, reviewId: string, isApproved: boolean): Promise<boolean> {
  try {
    // Use admin client for moderation operations
    const supabaseAdmin = createAdminClient();
    
    const { error } = await supabaseAdmin
      .from('reviews')
      .update({ is_approved: isApproved })
      .eq('id', reviewId)
      .eq('shop_slug', shopSlug);
      
    if (error) {
      console.error(`Error updating review ${reviewId} for ${shopSlug}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating review ${reviewId} for ${shopSlug}:`, error);
    return false;
  }
}
```

### 3.5 Update Next.js Pages

#### 3.5.1 City Listings Page (`src/app/find-boba-shops/[city]/page.tsx`)

```tsx
import { getShopsByCity, getCities } from '@/utils/data';
import { Metadata } from 'next';

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map(city => ({
    city: city.slug,
  }));
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const cities = await getCities();
  const city = cities.find(c => c.slug === params.city);
  
  return {
    title: `Boba Shops in ${city?.name || params.city} | Discover Boba`,
    description: `Find the best boba tea shops in ${city?.name || params.city}. Browse ratings, reviews, and locations of bubble tea shops.`,
  };
}

export default async function CityPage({ params }: { params: { city: string } }) {
  const shops = await getShopsByCity(params.city);
  
  // Rest of your component implementation
}
```

#### 3.5.2 Shop Detail Page (`src/app/boba-shop/[slug]/page.tsx`)

```tsx
import { getShopBySlug, getCities } from '@/utils/data';
import { Metadata } from 'next';

export async function generateStaticParams() {
  const cities = await getCities();
  const allShops = [];
  
  for (const city of cities) {
    const { data } = await supabase
      .from('shops')
      .select('slug')
      .eq('city', city.name);
      
    if (data) {
      allShops.push(...data);
    }
  }
  
  return allShops.map(shop => ({
    slug: shop.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const shop = await getShopBySlug(params.slug);
  
  if (!shop) {
    return {
      title: 'Shop Not Found | Discover Boba',
      description: 'The boba shop you are looking for could not be found.',
    };
  }
  
  return {
    title: `${shop.name} | Boba Shop in ${shop.city} | Discover Boba`,
    description: `Visit ${shop.name} in ${shop.city}. Check out their menu, ratings, reviews, and location.`,
  };
}

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const shop = await getShopBySlug(params.slug);
  
  // Rest of your component implementation
}
```

---

## 4. Testing Strategy

### 4.1 Unit Testing

Create unit tests for the data and reviews utilities:

```typescript
// tests/utils/data.test.ts
import { createSlug, extractTags } from '@/utils/data';

describe('Data Utilities', () => {
  test('createSlug should convert text to slug format', () => {
    expect(createSlug('Hello World')).toBe('hello-world');
    expect(createSlug('Boba & Tea')).toBe('boba-tea');
    expect(createSlug('Café Mocha')).toBe('caf-mocha');
  });
  
  test('extractTags should extract tags from about field', () => {
    const about = '{"features": ["Takeout", "Free Wi-Fi", "Outdoor seating"]}';
    const tags = extractTags(about);
    expect(tags).toContain('Takeout');
    expect(tags).toContain('Free Wi-Fi');
    expect(tags).toContain('Outdoor seating');
  });
});
```

### 4.2 Integration Testing

Test the migration scripts with a small sample dataset:

1. Create a test Supabase project
2. Create a small sample CSV file and JSON review file
3. Run the migration scripts against the test project
4. Verify the data was migrated correctly

### 4.3 End-to-End Testing

Test the full application with the new database:

1. Set up the application with the test Supabase project
2. Test all major user flows:
   - Browsing cities
   - Viewing shops
   - Filtering and sorting shops
   - Submitting reviews
   - Admin moderation of reviews

---

## 5. Deployment Strategy

### 5.1 Pre-Deployment Checklist

- [ ] Create production Supabase project
- [ ] Set up database schema and RLS policies
- [ ] Add Supabase environment variables to production environment
- [ ] Update CSP headers to allow Supabase connections
- [ ] Run migration scripts against production database
- [ ] Validate migration results

### 5.2 Deployment Steps

1. **Prepare for Deployment**:
   - Merge all changes to the main branch
   - Run tests to ensure everything is working correctly
   - Update environment variables in production

2. **Database Migration**:
   - Run the migration scripts against the production database
   - Validate the migration results

3. **Application Deployment**:
   - Deploy the updated application code
   - Monitor for any errors or issues

4. **Post-Deployment Verification**:
   - Verify all pages are loading correctly
   - Test shop listings and filtering
   - Test review submission and moderation

### 5.3 Rollback Plan

If issues are encountered during or after deployment:

1. **Identify the Issue**:
   - Determine if it's a database issue or an application code issue

2. **Database Rollback**:
   - If it's a database issue, run the rollback script to clear the database
   - Continue using the CSV-based system until the issue is resolved

3. **Code Rollback**:
   - If it's a code issue, roll back to the previous version of the application
   - Fix the issues and redeploy

---

## 6. Future Enhancements

### 6.1 Authentication and User Management

- Implement Supabase Auth for user authentication
- Allow shop owners to claim and manage their listings
- Add user profiles and saved favorites

### 6.2 Advanced Search and Filtering

- Implement full-text search using PostgreSQL's text search capabilities
- Add geolocation-based search to find shops near the user
- Implement advanced filtering options (price range, specific menu items, etc.)

### 6.3 Shop Owner Dashboard

- Create a dashboard for shop owners to manage their listings
- Allow uploading of photos, menu updates, and special promotions
- Provide analytics on page views and customer engagement

### 6.4 Premium Features and Monetization

- Implement the premium shop features (featured listings, logos, etc.)
- Set up Stripe integration for payments
- Create subscription plans for shop owners

---

## Summary

This comprehensive plan outlines the migration from a static CSV-based data system to a robust PostgreSQL database using Supabase. The migration includes:

1. **Database Architecture**: Complete schema design with proper data types, constraints, indexes, and security policies.

2. **Migration Strategy**: Detailed scripts for migrating shops and reviews, with validation and rollback capabilities.

3. **Application Updates**: Modifications to the data utilities and frontend components to work with the new database.

4. **Testing Strategy**: Unit, integration, and end-to-end testing to ensure a smooth transition.

5. **Deployment Strategy**: Step-by-step deployment plan with pre-deployment checks and rollback procedures.

6. **Future Enhancements**: Potential improvements to leverage the new database capabilities.

This migration will provide a more scalable, maintainable, and feature-rich foundation for the Discover Boba website, enabling future growth and monetization opportunities.
