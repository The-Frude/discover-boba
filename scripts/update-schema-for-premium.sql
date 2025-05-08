-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shop claim requests table
CREATE TABLE IF NOT EXISTS shop_claim_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT, -- Optional message from claimer
  admin_notes TEXT, -- Optional notes from admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to update updated_at column for shop_claim_requests
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shop_claim_requests_updated_at
BEFORE UPDATE ON shop_claim_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to update updated_at column for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS featured_logo TEXT; -- URL to the shop's logo for featured display
ALTER TABLE shops ADD COLUMN IF NOT EXISTS featured_order_url TEXT; -- Direct order URL for featured shops

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shop_claim_requests_shop_id ON shop_claim_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_claim_requests_user_id ON shop_claim_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_claim_requests_status ON shop_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_id ON subscriptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops(owner_id);

-- Row Level Security (RLS) policies
-- Allow shop owners to update their own shops
CREATE POLICY "Shop owners can update their own shops"
  ON shops FOR UPDATE
  USING (auth.uid() = owner_id);

-- Allow users to create claim requests
CREATE POLICY "Users can create claim requests"
  ON shop_claim_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own claim requests
CREATE POLICY "Users can view their own claim requests"
  ON shop_claim_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Allow admins to view all claim requests
CREATE POLICY "Admins can view all claim requests"
  ON shop_claim_requests FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Allow admins to update claim requests
CREATE POLICY "Admins can update claim requests"
  ON shop_claim_requests FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Allow users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Allow admins to view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Allow the system to insert subscriptions (for Stripe webhook)
CREATE POLICY "System can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (true);

-- Allow the system to update subscriptions (for Stripe webhook)
CREATE POLICY "System can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (true);
