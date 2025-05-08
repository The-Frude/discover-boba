import { supabase } from './supabase';

// Check if a user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Check if a user is an admin
export const isAdmin = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  try {
    const { data, error } = await supabase.rpc('get_user_role', {
      user_id: session.user.id
    });

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get the current user
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

// Check if a user owns a shop
export const isShopOwner = async (shopId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  try {
    const { data, error } = await supabase
      .from('shops')
      .select('id')
      .eq('id', shopId)
      .eq('owner_id', session.user.id)
      .single();

    if (error) {
      console.error('Error checking shop ownership:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking shop ownership:', error);
    return false;
  }
};

// Get shops owned by the current user
export const getOwnedShops = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', session.user.id);

    if (error) {
      console.error('Error fetching owned shops:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching owned shops:', error);
    return [];
  }
};

// Create a shop claim request
export const createShopClaimRequest = async (shopId: string, message: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('User not authenticated');

  try {
    const { data, error } = await supabase
      .from('shop_claim_requests')
      .insert({
        shop_id: shopId,
        user_id: session.user.id,
        status: 'pending',
        message
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shop claim request:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating shop claim request:', error);
    throw error;
  }
};

// Get claim requests for a user
export const getUserClaimRequests = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  try {
    const { data, error } = await supabase
      .from('shop_claim_requests')
      .select(`
        *,
        shops:shop_id (
          id,
          name,
          slug,
          formatted_address,
          city,
          state
        )
      `)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error fetching user claim requests:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user claim requests:', error);
    return [];
  }
};

// Get all claim requests (admin only)
export const getAllClaimRequests = async () => {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error('Unauthorized');

  try {
    const { data, error } = await supabase
      .from('shop_claim_requests')
      .select(`
        *,
        shops:shop_id (
          id,
          name,
          slug,
          formatted_address,
          city,
          state
        ),
        users:user_id (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all claim requests:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all claim requests:', error);
    throw error;
  }
};

// Approve a shop claim request (admin only)
export const approveClaimRequest = async (requestId: string) => {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error('Unauthorized');

  try {
    // Get the request details
    const { data: request, error: requestError } = await supabase
      .from('shop_claim_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.error('Error fetching claim request:', requestError);
      throw requestError;
    }

    // Start a transaction
    const { error: updateError } = await supabase.rpc('approve_shop_claim', {
      request_id: requestId,
      shop_id: request.shop_id,
      user_id: request.user_id
    });

    if (updateError) {
      console.error('Error approving claim request:', updateError);
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Error approving claim request:', error);
    throw error;
  }
};

// Reject a shop claim request (admin only)
export const rejectClaimRequest = async (requestId: string, adminNotes: string) => {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) throw new Error('Unauthorized');

  try {
    const { error } = await supabase
      .from('shop_claim_requests')
      .update({
        status: 'rejected',
        admin_notes: adminNotes
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting claim request:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error rejecting claim request:', error);
    throw error;
  }
};
