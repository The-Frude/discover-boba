-- Function to process premium subscription
-- This function is called by the webhook handler when a checkout.session.completed event is received
-- It updates the shop's premium status and creates a subscription record
CREATE OR REPLACE FUNCTION process_premium_subscription(
  p_shop_id UUID,
  p_user_id UUID,
  p_stripe_customer_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_plan_type TEXT,
  p_featured_until TIMESTAMP WITH TIME ZONE,
  p_status TEXT
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_subscription_id UUID;
BEGIN
  -- Begin transaction
  BEGIN
    -- Update shop premium status
    UPDATE shops
    SET 
      is_premium = TRUE,
      featured_until = p_featured_until,
      updated_at = NOW()
    WHERE id = p_shop_id;
    
    -- Create subscription record
    INSERT INTO subscriptions (
      shop_id,
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      plan_type,
      status,
      current_period_start,
      current_period_end
    ) VALUES (
      p_shop_id,
      p_user_id,
      p_stripe_customer_id,
      p_stripe_payment_intent_id,
      p_plan_type,
      p_status,
      NOW(),
      p_featured_until
    )
    RETURNING id INTO v_subscription_id;
    
    -- Prepare result
    v_result = jsonb_build_object(
      'success', TRUE,
      'shop_id', p_shop_id,
      'subscription_id', v_subscription_id,
      'featured_until', p_featured_until
    );
    
    -- Commit transaction
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_premium_subscription TO service_role;
