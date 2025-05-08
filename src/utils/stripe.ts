import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil', // Use the latest stable API version
});

// Premium plan price IDs
export const PREMIUM_PLANS = {
  MONTHLY: process.env.STRIPE_MONTHLY_PRICE_ID!,
  ANNUAL: process.env.STRIPE_ANNUAL_PRICE_ID!,
};

// Plan durations in months
export const PLAN_DURATIONS = {
  MONTHLY: 1,
  ANNUAL: 12,
};

/**
 * Create a Stripe Checkout session for premium subscription
 */
export async function createCheckoutSession({
  shopId,
  priceId,
  customerId,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  shopId: string;
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer: customerId,
    customer_email: !customerId ? customerEmail : undefined,
    metadata: {
      shopId,
    },
  });

  return session;
}

/**
 * Verify Stripe webhook signature
 */
export function constructEventFromPayload(signature: string, payload: Buffer) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  );
}

/**
 * Calculate the featured until date based on the plan
 */
export function calculateFeaturedUntilDate(planType: 'MONTHLY' | 'ANNUAL'): Date {
  const today = new Date();
  const featuredUntil = new Date(today);
  featuredUntil.setMonth(today.getMonth() + PLAN_DURATIONS[planType]);
  return featuredUntil;
}

/**
 * Get Stripe customer by ID
 */
export async function getCustomer(customerId: string) {
  return stripe.customers.retrieve(customerId);
}

/**
 * Create a new Stripe customer
 */
export async function createCustomer({
  email,
  name,
  metadata,
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

export default stripe;
