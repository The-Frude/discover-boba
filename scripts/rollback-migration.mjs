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
