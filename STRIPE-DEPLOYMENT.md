# Stripe Integration Deployment Guide

This guide outlines the steps needed to deploy the Stripe integration for premium listings to production.

## Prerequisites

- Stripe account with API keys
- Access to your production Supabase instance
- Vercel deployment access

## Step 1: Database Migration

Execute the SQL scripts in your production Supabase instance:

1. Run `scripts/update-schema-for-premium.sql` to create the necessary tables and columns
2. Run `scripts/create-approve-shop-claim-function.sql` to add the SQL function for approving shop claims
3. Run `scripts/create-process-premium-subscription-function.sql` to add the SQL function for processing premium subscriptions

You can execute these scripts in the Supabase SQL Editor.

## Step 2: Environment Variables

Add the following environment variables to your Vercel project:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51LcCEeEIUBSp5Viopwl82XW0I3sMrxlcr4DaqqfYIwzXSsyHuYVs8RQrMoizEvbdyyqiSnzrg2dmir8gUJn6SeFe00P5lxggsM
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_7btAaX0bssQ5xqn1dWjj4MiljZ2E5Ovk
STRIPE_MONTHLY_PRICE_ID=price_1RMC6rEIUBSp5ViospFrZTkY
STRIPE_ANNUAL_PRICE_ID=price_1RMCC6EIUBSp5ViohNWxIcyi
```

## Step 3: Deploy to Production

Deploy your application to Vercel:

```bash
vercel --prod
```

Or use the Vercel GitHub integration to deploy automatically.

## Step 4: Configure Stripe Webhook

After deployment, you need to configure the Stripe webhook to point to your production endpoint:

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select the event `checkout.session.completed`
5. Click "Add endpoint"

The webhook secret is already configured in your environment variables.

## Step 5: Test the Integration

Test the premium subscription flow in production:

1. Log in as a shop owner
2. Go to the dashboard
3. Select a shop and click "Upgrade to Premium"
4. Select a plan and click "Upgrade Now"
5. Complete the checkout process using the test card number `4242 4242 4242 4242`
6. Verify that the shop is marked as premium in the database
7. Verify that the subscription record is created in the database

## Troubleshooting

### Webhook Issues

If webhooks are not being received:

1. Check the Stripe Dashboard for webhook delivery attempts
2. Verify that the webhook URL is correct
3. Verify that the webhook secret is correct
4. Check the server logs for any errors

### Payment Issues

If payments are not being processed:

1. Check the Stripe Dashboard for payment attempts
2. Verify that the price IDs are correct
3. Verify that the API keys are correct
4. Check the server logs for any errors

## Next Steps

After deploying the Stripe integration, you should:

1. Implement email notifications for subscription events
2. Create the admin features for managing premium listings and users
3. Update the documentation for users and admins

These tasks are tracked in the `Premium-listings-progress.md` file.
