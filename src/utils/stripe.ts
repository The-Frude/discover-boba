import Stripe from 'stripe';

// Detect if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && 
                   (process.env.NEXT_PHASE === 'build' || process.env.NEXT_PHASE === 'phase-production-build');

// If we're in a build environment, use the safe version
if (isBuildTime) {
  console.log('Using mock Stripe implementation during build');
  module.exports = require('./stripe-safe');
  // Exit early to prevent further execution
  // @ts-ignore - This is a hack to prevent TypeScript from complaining
  if (true) return;
}

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

// Plan durations in months
export const PLAN_DURATIONS = {
  MONTHLY: 1,
  ANNUAL: 12,
};

// Lazy initialization of Stripe client
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  const stripeSecretKey = getEnvVar('STRIPE_SECRET_KEY');
  
  if (!stripeSecretKey) {
    throw new Error('Stripe client not initialized: Missing STRIPE_SECRET_KEY');
  }

  try {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2025-04-30.basil', // Use the latest stable API version
    });
    return stripeInstance;
  } catch (error) {
    console.error('Stripe initialization error:', error);
    throw new Error('Failed to initialize Stripe client');
  }
}

// Premium plan price IDs - lazy loaded
export function getPremiumPlans() {
  return {
    MONTHLY: getEnvVar('STRIPE_MONTHLY_PRICE_ID'),
    ANNUAL: getEnvVar('STRIPE_ANNUAL_PRICE_ID'),
  };
}

// For backward compatibility
export const PREMIUM_PLANS = {
  get MONTHLY() { return getPremiumPlans().MONTHLY; },
  get ANNUAL() { return getPremiumPlans().ANNUAL; }
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
  try {
    const stripe = getStripe();
    
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
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Verify Stripe webhook signature
 */
export function constructEventFromPayload(signature: string, payload: Buffer) {
  const stripe = getStripe();
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
  const stripe = getStripe();
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
  const stripe = getStripe();
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

// For backward compatibility
export default {
  get instance() { 
    try {
      return getStripe();
    } catch (e) {
      return null;
    }
  }
};
