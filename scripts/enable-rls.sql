-- =================================================================
-- Enable Row-Level Security on all public tables
-- Fixes Supabase security advisor: rls_disabled_in_public
--
-- Root cause: scripts/update-schema-for-premium.sql defined CREATE
-- POLICY statements for shops/shop_claim_requests/subscriptions but
-- never ran ALTER TABLE ... ENABLE ROW LEVEL SECURITY, so none of
-- those policies were ever actually enforced. The `reviews` table
-- has no RLS or policies checked into the repo at all.
--
-- Safe to run multiple times (uses DROP POLICY IF EXISTS before each
-- CREATE POLICY, and ENABLE ROW LEVEL SECURITY is idempotent).
-- =================================================================

-- -----------------------------------------------------------------
-- shops: public directory data. Server-rendered city/shop pages
-- read this table via the anon client, so it MUST stay publicly
-- readable or the live site breaks. Only the owning shop owner can
-- update their own row. No public INSERT/DELETE policy is added on
-- purpose -- shop records are only created/removed by admin scripts
-- using the service-role key, which bypasses RLS entirely.
-- -----------------------------------------------------------------
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view shops" ON shops;
CREATE POLICY "Public can view shops"
  ON shops FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Shop owners can update their own shops" ON shops;
CREATE POLICY "Shop owners can update their own shops"
  ON shops FOR UPDATE
  USING (auth.uid() = owner_id);


-- -----------------------------------------------------------------
-- shop_claim_requests: claimant messages + admin notes. Existing
-- policies (unchanged) already scope access correctly -- just
-- turning on enforcement.
-- -----------------------------------------------------------------
ALTER TABLE shop_claim_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create claim requests" ON shop_claim_requests;
CREATE POLICY "Users can create claim requests"
  ON shop_claim_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own claim requests" ON shop_claim_requests;
CREATE POLICY "Users can view their own claim requests"
  ON shop_claim_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all claim requests" ON shop_claim_requests;
CREATE POLICY "Admins can view all claim requests"
  ON shop_claim_requests FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Admins can update claim requests" ON shop_claim_requests;
CREATE POLICY "Admins can update claim requests"
  ON shop_claim_requests FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');


-- -----------------------------------------------------------------
-- subscriptions: Stripe customer/subscription data. The Stripe
-- webhook and checkout-session routes both write via the
-- service-role key (src/app/api/stripe/webhook/route.ts,
-- src/app/api/stripe/create-checkout-session/route.ts), which
-- bypasses RLS entirely -- so no public INSERT/UPDATE policy is
-- needed for the app to keep working.
--
-- The previous "System can insert/update subscriptions" policies
-- used WITH CHECK (true) / USING (true) with no role restriction,
-- which -- once RLS was actually turned on -- would have let ANY
-- anon or authenticated caller forge or edit subscription rows, not
-- just the webhook. Dropping them rather than re-creating them.
-- -----------------------------------------------------------------
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "System can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "System can update subscriptions" ON subscriptions;
-- (intentionally not re-created -- service_role already bypasses RLS)


-- -----------------------------------------------------------------
-- reviews: not present in any checked-in migration today. Public
-- can read only approved reviews (matches getReviewsByShopSlug's
-- existing .eq('is_approved', true) filter -- without this policy
-- that filter is just a UI convention, not an actual restriction,
-- since anyone could call the Supabase REST API directly and omit
-- it). Anyone can submit a new review, but the submitted row must
-- land as unapproved/unverified -- moderation state can no longer
-- be set by the client itself, regardless of the
-- REVIEW_MODERATION_ENABLED app setting. This is a small behavior
-- tightening: if REVIEW_MODERATION_ENABLED=false in some
-- environment, new reviews will still require manual approval after
-- this change, where previously they could auto-publish.
-- -----------------------------------------------------------------
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
CREATE POLICY "Public can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true);

DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Anyone can submit a review" ON reviews;
CREATE POLICY "Anyone can submit a review"
  ON reviews FOR INSERT
  WITH CHECK (is_approved = false AND is_verified = false);
