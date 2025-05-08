import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAdminClient } from '@/utils/supabase';
import { createCheckoutSession, PREMIUM_PLANS } from '@/utils/stripe';
import { isShopOwner, getCurrentUser } from '@/utils/auth';

export async function POST(req: NextRequest) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { shopId, planType, successUrl, cancelUrl } = body;

    // Validate required fields
    if (!shopId || !planType || !successUrl || !cancelUrl) {
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

    // Check if user owns the shop
    const isOwner = await isShopOwner(shopId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to upgrade this shop' },
        { status: 403 }
      );
    }

    // Get shop details
    const { data: shop, error: shopError } = await supabase
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
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      shopId,
      priceId: planType === 'MONTHLY' ? PREMIUM_PLANS.MONTHLY : PREMIUM_PLANS.ANNUAL,
      customerEmail: userData?.email || user.email,
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
