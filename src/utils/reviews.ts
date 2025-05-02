import { supabase, createAdminClient } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface Review {
  id: string;
  shop_id: string;
  shop_slug: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  date: string;
  is_verified: boolean;
  is_approved: boolean;
}

// Function to get all reviews for a shop
export async function getReviewsByShopSlug(shopSlug: string): Promise<Review[]> {
  try {
    // For public access, only get approved reviews
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('shop_slug', shopSlug)
      .eq('is_approved', true)
      .order('date', { ascending: false });
      
    if (error) {
      console.error(`Error getting reviews for ${shopSlug}:`, error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error getting reviews for ${shopSlug}:`, error);
    return [];
  }
}

// Function to add a new review for a shop
export async function addReview(review: Omit<Review, 'id' | 'date' | 'is_verified' | 'is_approved' | 'shop_id'>): Promise<Review> {
  try {
    // Get the shop ID
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('slug', review.shop_slug)
      .single();
      
    if (shopError) {
      console.error(`Error finding shop with slug ${review.shop_slug}:`, shopError);
      throw new Error('Failed to add review: Shop not found');
    }
    
    // Create a new review with additional fields
    const newReview = {
      id: uuidv4(),
      shop_id: shopData.id,
      shop_slug: review.shop_slug,
      user_name: review.user_name,
      user_email: review.user_email,
      rating: review.rating,
      comment: review.comment,
      date: new Date().toISOString(),
      is_verified: false, // In a real app, this would be set based on user authentication
      is_approved: process.env.REVIEW_MODERATION_ENABLED === 'true' ? false : true, // Auto-approve if moderation is disabled
    };
    
    // Insert the review
    const { data, error } = await supabase
      .from('reviews')
      .insert([newReview])
      .select()
      .single();
      
    if (error) {
      console.error(`Error adding review for ${review.shop_slug}:`, error);
      throw new Error('Failed to add review');
    }
    
    return data;
  } catch (error) {
    console.error(`Error adding review for ${review.shop_slug}:`, error);
    throw new Error('Failed to add review');
  }
}

// Function to get the average rating for a shop
export async function getAverageRating(shopSlug: string): Promise<{ average: number; count: number }> {
  try {
    // Only consider approved reviews for the average rating
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('shop_slug', shopSlug)
      .eq('is_approved', true);
      
    if (error) {
      console.error(`Error getting ratings for ${shopSlug}:`, error);
      return { average: 0, count: 0 };
    }
    
    if (data.length === 0) {
      return { average: 0, count: 0 };
    }
    
    const sum = data.reduce((total, review) => total + review.rating, 0);
    const average = sum / data.length;
    
    return {
      average: parseFloat(average.toFixed(1)),
      count: data.length,
    };
  } catch (error) {
    console.error(`Error getting average rating for ${shopSlug}:`, error);
    return { average: 0, count: 0 };
  }
}

// Function to delete a review (for moderation purposes)
export async function deleteReview(shopSlug: string, reviewId: string): Promise<boolean> {
  try {
    // Use admin client for moderation operations
    const supabaseAdmin = createAdminClient();
    
    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('shop_slug', shopSlug);
      
    if (error) {
      console.error(`Error deleting review ${reviewId} for ${shopSlug}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting review ${reviewId} for ${shopSlug}:`, error);
    return false;
  }
}

// Function to update a review's approval status (for moderation purposes)
export async function updateReviewApproval(shopSlug: string, reviewId: string, isApproved: boolean): Promise<boolean> {
  try {
    // Use admin client for moderation operations
    const supabaseAdmin = createAdminClient();
    
    const { error } = await supabaseAdmin
      .from('reviews')
      .update({ is_approved: isApproved })
      .eq('id', reviewId)
      .eq('shop_slug', shopSlug);
      
    if (error) {
      console.error(`Error updating review ${reviewId} for ${shopSlug}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating review ${reviewId} for ${shopSlug}:`, error);
    return false;
  }
}

// Function to get all reviews (for admin purposes)
export async function getAllReviews(): Promise<Review[]> {
  try {
    // Use admin client for moderation operations
    const supabaseAdmin = createAdminClient();
    
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) {
      console.error('Error getting all reviews:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting all reviews:', error);
    return [];
  }
}
