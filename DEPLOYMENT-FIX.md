# Deployment Fix for Stripe Integration

## Issue Summary

During the build process, the following error was encountered:

```
Error: Neither apiKey nor config.authenticator provided
    at <unknown> (.next/server/edge-chunks/810.js:5)
    at r._setAuthenticator (.next/server/edge-chunks/810.js:5:152436)
    at new r (.next/server/edge-chunks/810.js:5:147069)
    at 35 (.next/server/app/api/stripe/create-checkout-session/route.js:1:509)
```

This error occurred in the `/api/stripe/create-checkout-session` route and was related to how the Supabase client is initialized in server components during the build process.

## Root Cause

The error was caused by improper initialization of the Supabase client in API routes. In Next.js App Router, API routes are server components that run during build time to generate server-side code. The Supabase client needs special configuration to work in this environment, especially when dealing with authentication.

The specific issues were:

1. The Supabase client was not properly configured for server-side rendering during build time
2. The client was trying to access cookies or other browser-specific features that are not available during the build process
3. The authentication flow was not properly handled between client and server components
4. The Edge Runtime was causing compatibility issues with Supabase and Stripe initialization

## Solution Implemented

We implemented the following changes to fix the issue:

### 1. Updated API Routes

For both Stripe API routes (`/api/stripe/create-checkout-session` and `/api/stripe/webhook`):

- Removed Edge Runtime configuration to use Node.js runtime instead for better compatibility
- Added robust environment variable handling with proper error messages
- Implemented safer Supabase client initialization with null checks
- Added comprehensive error handling for all operations
- Used the admin client with service role key for database operations

### 2. Updated Stripe Utility

For the Stripe utility (`/src/utils/stripe.ts`):

- Added safe environment variable handling with fallbacks
- Implemented defensive initialization of the Stripe client
- Added null checks before using the Stripe client in all functions
- Improved error handling and reporting

### 3. Updated Client Component

For the upgrade page component (`/app/dashboard/upgrade/[shopId]/page.tsx`):

- Added explicit user authentication checks
- Improved error handling for API requests
- Ensured user ID is explicitly passed to the API route
- Added better error reporting for debugging

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

## Environment Variables

Ensure the following environment variables are properly set in your Vercel project and GitHub Actions:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_MONTHLY_PRICE_ID=your_stripe_monthly_price_id
STRIPE_ANNUAL_PRICE_ID=your_stripe_annual_price_id
```

All of these environment variables are required for the Stripe integration to work properly. Missing any of them will cause the build to fail or the application to behave unexpectedly.

## Deployment Checklist

Before deploying to production, ensure:

1. All environment variables are correctly set in Vercel
2. The build completes successfully locally
3. The Stripe webhook endpoint is configured in the Stripe dashboard
4. The Supabase database has the necessary tables and functions

## Future Considerations

1. Consider using Server Actions instead of API routes for better server-side authentication support
2. Implement email notifications for subscription events
3. Create admin features for managing premium listings and users
4. Update documentation for users and admins
5. Add more comprehensive error logging and monitoring

## References

- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Next.js App Router API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Node.js Runtime in Next.js](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Stripe API Documentation](https://stripe.com/docs/api)
