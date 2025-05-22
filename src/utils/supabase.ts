import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Always use the production URL for auth redirects in production
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discoverboba.com';

// Ensure we're not using localhost in production
const redirectUrl = siteUrl.includes('localhost') && process.env.NODE_ENV === 'production' 
  ? 'https://discoverboba.com' 
  : siteUrl;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Change to false to prevent automatic handling
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'discover-boba'
    }
  }
});

// Log Supabase configuration for debugging
if (typeof window !== 'undefined') {
  console.log('[Supabase Debug] Client initialized with config:', { 
    detectSessionInUrl: false,
    flowType: 'pkce'
  });
}

// Configure site URL for auth operations
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // Set the site URL for redirects
      try {
        if (session) {
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        }
      } catch (error) {
        console.error('Error setting session:', error);
      }
    }
  });
}

// Use this for auth operations that need redirect URLs
export const getSignUpOptions = () => {
  // Always use the production URL for auth redirects in production
  const redirectBase = siteUrl.includes('localhost') && process.env.NODE_ENV === 'production' 
    ? 'https://discoverboba.com' 
    : siteUrl;
    
  return {
    emailRedirectTo: `${redirectBase}/dashboard`
  };
};

// Create an admin client for server-side operations
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};
