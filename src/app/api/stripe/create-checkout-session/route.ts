import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCheckoutSession, PREMIUM_PLANS } from '@/utils/stripe';
import { Database } from '@/types/supabase';

// Add Edge Runtime to ensure consistent environment between build and runtime
export const runtime = 'edge';

// Create a server-specific Supabase admin client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  }
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { shopId, planType, successUrl, cancelUrl, userId } = body;

    // Validate required fields
    if (!shopId || !planType || !successUrl || !cancelUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate plan type
    if (planType !== 'MONTHLY' && planType !== 'ANNUAL') {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Check if user owns the shop using admin client
    const { data: shopData, error: shopOwnerError } = await adminClient
      .from('shops')
      .select('id')
      .eq('id', shopId)
      .eq('owner_id', userId)
      .single();

    if (shopOwnerError || !shopData) {
      return NextResponse.json(
        { error: 'You do not have permission to upgrade this shop' },
        { status: 403 }
      );
    }

    // Get shop details
    const { data: shop, error: shopError } = await adminClient
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get user details for Stripe customer
    const { data: userData, error: userError } = await adminClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      shopId,
      priceId: planType === 'MONTHLY' ? PREMIUM_PLANS.MONTHLY : PREMIUM_PLANS.ANNUAL,
      customerEmail: userData?.email || 'customer@example.com',
      successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl,
    });

    // Return the session URL
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
