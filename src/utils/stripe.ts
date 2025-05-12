import Stripe from 'stripe';

// Safely get environment variables with fallbacks
const getEnvVar = (name: string, required = false): string => {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  if (!value) {
    console.warn(`Environment variable ${name} is not set`);
    return '';
  }
  return value;
};

// Initialize Stripe with the secret key
const stripeSecretKey = getEnvVar('STRIPE_SECRET_KEY');
let stripe: Stripe | null = null;

try {
  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-04-30.basil', // Use the latest stable API version
    });
  } else {
    console.error('Stripe initialization failed: Missing STRIPE_SECRET_KEY');
  }
} catch (error) {
  console.error('Stripe initialization error:', error);
}

// Premium plan price IDs
export const PREMIUM_PLANS = {
  MONTHLY: getEnvVar('STRIPE_MONTHLY_PRICE_ID'),
  ANNUAL: getEnvVar('STRIPE_ANNUAL_PRICE_ID'),
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
  if (!stripe) {
    throw new Error('Stripe client not initialized');
  }

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
  if (!stripe) {
    throw new Error('Stripe client not initialized');
  }

  const webhookSecret = getEnvVar('STRIPE_WEBHOOK_SECRET', true);
  
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
  if (!stripe) {
    throw new Error('Stripe client not initialized');
  }
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
  if (!stripe) {
    throw new Error('Stripe client not initialized');
  }
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

export default stripe;
