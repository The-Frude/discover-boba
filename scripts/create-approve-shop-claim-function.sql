-- Function to approve a shop claim request in a transaction
CREATE OR REPLACE FUNCTION approve_shop_claim(
  request_id UUID,
  shop_id UUID,
  user_id UUID
) RETURNS void AS $$
BEGIN
  -- Update the shop owner
  UPDATE shops
  SET owner_id = user_id
  WHERE id = shop_id;
  
  -- Update the claim request status
  UPDATE shop_claim_requests
  SET status = 'approved',
      updated_at = NOW()
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;
