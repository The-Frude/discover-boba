import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

// Create a single supabase client for client-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createClient = () => {
  console.log('[Supabase Client Debug] Creating new client instance');
  
  const client = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Set to false to prevent automatic handling
      flowType: 'pkce'
    }
  });
  
  console.log('[Supabase Client Debug] Client created successfully');
  
  return client;
};
