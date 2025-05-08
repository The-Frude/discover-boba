import { NextRequest, NextResponse } from 'next/server';
import { constructEventFromPayload, calculateFeaturedUntilDate } from '@/utils/stripe';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { Stripe } from 'stripe';

// Create a server-specific Supabase admin client with no session persistence
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  }
});

// This endpoint needs to be configured in the Stripe dashboard
// to receive webhook events for checkout.session.completed
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  try {
    // Verify the webhook signature
    const event = constructEventFromPayload(signature, Buffer.from(body));

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Get the shop ID from the session metadata
  const shopId = session.metadata?.shopId;
  if (!shopId) {
    throw new Error('No shop ID found in session metadata');
  }

  // Get the customer ID and subscription ID
  const customerId = session.customer as string;
  const paymentIntentId = session.payment_intent as string;

  // Determine the plan type from the line items
  const lineItems = session.line_items?.data;
  if (!lineItems || lineItems.length === 0) {
    throw new Error('No line items found in session');
  }

  // Get the price ID from the line items
  const priceId = lineItems[0].price?.id;
  if (!priceId) {
    throw new Error('No price ID found in line items');
  }

  // Determine if this is a monthly or annual plan
  const isMonthly = priceId === process.env.STRIPE_MONTHLY_PRICE_ID;
  const planType = isMonthly ? 'MONTHLY' : 'ANNUAL';

  // Calculate the featured until date
  const featuredUntil = calculateFeaturedUntilDate(planType);

  // Start a transaction to update the shop and create a subscription record
  const { data, error } = await adminClient.rpc('process_premium_subscription', {
    p_shop_id: shopId,
    p_user_id: session.client_reference_id,
    p_stripe_customer_id: customerId,
    p_stripe_payment_intent_id: paymentIntentId,
    p_plan_type: planType.toLowerCase(),
    p_featured_until: featuredUntil.toISOString(),
    p_status: 'active'
  });

  if (error) {
    console.error('Error processing premium subscription:', error);
    throw error;
  }

  console.log('Premium subscription processed successfully:', data);
}

// Configure the API route to accept raw body
export const config = {
  api: {
    bodyParser: false,
  },
};
