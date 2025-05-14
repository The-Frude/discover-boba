// A build-time safe version of stripe utilities
// This file is used during static generation to prevent errors

// Safe version of premium plans
export const PREMIUM_PLANS = {
  MONTHLY: 'mock_monthly_price_id',
  ANNUAL: 'mock_annual_price_id',
};

// Plan durations in months
export const PLAN_DURATIONS = {
  MONTHLY: 1,
  ANNUAL: 12,
};

// Safe calculation function that works during build
export function calculateFeaturedUntilDate(planType: 'MONTHLY' | 'ANNUAL'): Date {
  const today = new Date();
  const featuredUntil = new Date(today);
  featuredUntil.setMonth(today.getMonth() + (planType === 'MONTHLY' ? 1 : 12));
  return featuredUntil;
}

// Mock Stripe checkout session creation
export async function createCheckoutSession(params: any) {
  return {
    id: 'mock_session_id',
    url: 'https://example.com/checkout',
  };
}

// Mock webhook verification
export function constructEventFromPayload(signature: string, payload: Buffer) {
  return {
    type: 'mock.event',
    data: {
      object: {},
    },
  };
}

// Mock customer retrieval
export async function getCustomer(customerId: string) {
  return {
    id: customerId,
    email: 'mock@example.com',
  };
}

// Mock customer creation
export async function createCustomer(params: any) {
  return {
    id: 'mock_customer_id',
    email: params.email,
  };
}

// Default export for compatibility
export default null;
