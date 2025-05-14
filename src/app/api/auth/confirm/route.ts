import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export async function POST(request: Request) {
  try {
    const { code, email } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Confirmation code is required' },
        { status: 400 }
      );
    }
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Create a server-side Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        }
      }
    );
    
    // Verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      type: 'signup',
      token: code,
      email: email
    });
    
    if (error) {
      console.error('Error verifying email:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in confirm API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
