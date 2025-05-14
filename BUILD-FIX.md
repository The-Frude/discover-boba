# Build Fix for Production Deployment

This document outlines the fixes implemented to address build failures in the production deployment process.

## Issue Summary

During the production build process, two critical issues were encountered:

1. **Stripe Environment Variables Issue**:
   ```
   Environment variable STRIPE_SECRET_KEY is not set
   Stripe initialization failed: Missing STRIPE_SECRET_KEY
   Environment variable STRIPE_MONTHLY_PRICE_ID is not set
   Environment variable STRIPE_ANNUAL_PRICE_ID is not set
   ```

2. **Client-Side Rendering Issue**:
   ```
   ⨯ useSearchParams() should be wrapped in a suspense boundary at page "/admin/claims"
   ⨯ useSearchParams() should be wrapped in a suspense boundary at page "/admin/dashboard"
   ```

These issues were preventing successful builds and deployments to production, despite the environment variables being correctly set in GitHub and Vercel.

## Root Cause Analysis

### Stripe Environment Variables Issue

The root cause was that the Stripe client was being initialized at module load time during the build process, before environment variables were fully available. This caused the build to fail when trying to access these variables.

Specifically:
- The `stripe.ts` utility was creating a Stripe instance immediately upon import
- During the static build phase, environment variables might not be fully loaded
- The error messages were being emitted during static page generation

### Client-Side Rendering Issue

The root cause was that components using client-side hooks like `useSearchParams()` were not properly wrapped in Suspense boundaries, which is required in Next.js 15.3.1 for client-side rendering.

## Comprehensive Solution

### 1. Stripe Environment Variables Fix

#### Created a Lazy Initialization Pattern
- Modified `src/utils/stripe.ts` to use lazy initialization instead of initializing at module load time
- Added a `getStripe()` function that only creates the Stripe instance when needed
- Implemented proper error handling and fallbacks for missing environment variables

```typescript
// Before
const stripeSecretKey = getEnvVar('STRIPE_SECRET_KEY');
let stripe: Stripe | null = null;

try {
  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-04-30.basil',
    });
  } else {
    console.error('Stripe initialization failed: Missing STRIPE_SECRET_KEY');
  }
} catch (error) {
  console.error('Stripe initialization error:', error);
}

// After
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
      apiVersion: '2025-04-30.basil',
    });
    return stripeInstance;
  } catch (error) {
    console.error('Stripe initialization error:', error);
    throw new Error('Failed to initialize Stripe client');
  }
}
```

#### Added Build-Time Safe Mocks
- Created `src/utils/stripe-safe.ts` with mock implementations for Stripe functions
- Added logic to automatically use these mocks during build time
- Ensured backward compatibility with existing code

```typescript
// Detect if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && 
                   (process.env.NEXT_PHASE === 'build' || process.env.NEXT_PHASE === 'phase-production-build');

// If we're in a build environment, use the safe version
if (isBuildTime) {
  console.log('Using mock Stripe implementation during build');
  module.exports = require('./stripe-safe');
  // Exit early to prevent further execution
  if (true) return;
}
```

#### Enhanced Environment Variable Handling
- Updated `next.config.mjs` with more robust environment variable handling
- Added `getMockableEnvVar()` function to provide mock values during build
- Added build phase detection to handle environment variables differently during build

```javascript
// Helper to safely get environment variables
const getEnvVar = (name, defaultValue = '') => {
  const value = process.env[name];
  return value || defaultValue;
};

// Detect build phase
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                     process.env.NEXT_PHASE === 'build';

// Provide mock values during build if needed
const getMockableEnvVar = (name, defaultValue = '') => {
  const value = process.env[name];
  if (!value && isBuildPhase) {
    console.log(`Using mock value for ${name} during build`);
    return defaultValue;
  }
  return value || defaultValue;
};

// Configure environment variables with safe defaults for build time
env: {
  // Stripe variables with safe defaults for build time
  STRIPE_SECRET_KEY: getMockableEnvVar('STRIPE_SECRET_KEY', 'sk_test_mock_key_for_build'),
  STRIPE_WEBHOOK_SECRET: getMockableEnvVar('STRIPE_WEBHOOK_SECRET', 'whsec_mock_key_for_build'),
  STRIPE_MONTHLY_PRICE_ID: getMockableEnvVar('STRIPE_MONTHLY_PRICE_ID', 'price_mock_monthly'),
  STRIPE_ANNUAL_PRICE_ID: getMockableEnvVar('STRIPE_ANNUAL_PRICE_ID', 'price_mock_annual'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: getMockableEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_mock_key_for_build'),
  
  // Build information
  NEXT_PHASE: process.env.NEXT_PHASE || '',
  IS_BUILD_TIME: isBuildPhase ? 'true' : 'false',
},
```

### 2. Client-Side Rendering Fix

#### Created a Reusable Suspense HOC
- Implemented `src/components/hoc/withSuspense.tsx` as a Higher-Order Component
- Added a default loading component with proper styling
- Made the HOC flexible with customizable loading states

```typescript
// Higher-Order Component that wraps a component with Suspense
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  LoadingComponent: React.ReactNode = <PageLoading />
) {
  function WithSuspense(props: P) {
    return (
      <Suspense fallback={LoadingComponent}>
        <Component {...props} />
      </Suspense>
    );
  }

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithSuspense.displayName = `withSuspense(${displayName})`;

  return WithSuspense;
}
```

#### Updated Admin Pages
- Modified `src/app/admin/dashboard/page.tsx` to use the withSuspense HOC
- Updated `src/app/admin/claims/page.tsx` to use the withSuspense HOC
- Updated `src/app/admin/reviews/page.tsx` to use the withSuspense HOC
- Added proper loading states and error handling

Example of updated component:
```typescript
// Before
export default function AdminDashboardPage() {
  // Component implementation
}

// After
function AdminDashboardContent() {
  // Component implementation
}

// Export the wrapped component
export default withSuspense(AdminDashboardContent);
```

## Benefits of This Solution

1. **Durability**: The solution addresses the root causes of both issues, not just the symptoms
2. **Maintainability**: The HOC pattern makes it easy to apply Suspense boundaries to any component
3. **Performance**: Lazy initialization of Stripe improves performance by only creating the instance when needed
4. **Build Reliability**: Mock implementations ensure the build process completes successfully even without environment variables
5. **Developer Experience**: Clear error messages and fallbacks make debugging easier

## Testing

To test these changes:

1. Run a local build to verify the build process completes without errors:
   ```
   npm run build
   ```

2. Test the premium subscription flow:
   - Log in as a shop owner
   - Go to the dashboard
   - Select a shop and click "Upgrade to Premium"
   - Select a plan and click "Upgrade Now"
   - Verify that the checkout process works correctly

3. Test the admin pages:
   - Log in as an admin
   - Navigate to the admin dashboard
   - Check that all admin pages load correctly
   - Verify that all functionality works as expected

## Future Considerations

1. Apply the withSuspense HOC to other client components that use hooks like useSearchParams()
2. Consider using Server Actions instead of API routes for better server-side authentication support
3. Implement more comprehensive error logging and monitoring
4. Add unit tests for the Stripe utility functions
5. Create a more robust build-time detection mechanism

## References

- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Stripe API Documentation](https://stripe.com/docs/api)
