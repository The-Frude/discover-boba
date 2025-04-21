import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface Review {
  id: string;
  shopId: string;
  shopSlug: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  date: string;
  isVerified: boolean;
  isApproved: boolean;
}

// Function to get the reviews file path for a shop
function getReviewsFilePath(shopSlug: string): string {
  const reviewsDir = path.join(process.cwd(), 'data', 'reviews');
  
  // Create the reviews directory if it doesn't exist
  if (!fs.existsSync(reviewsDir)) {
    fs.mkdirSync(reviewsDir, { recursive: true });
  }
  
  return path.join(reviewsDir, `${shopSlug}.json`);
}

// Function to get all reviews for a shop
export async function getReviewsByShopSlug(shopSlug: string): Promise<Review[]> {
  const filePath = getReviewsFilePath(shopSlug);
  
  // If the file doesn't exist, return an empty array
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const reviews = JSON.parse(fileContent) as Review[];
    
    // Sort reviews by date (newest first)
    return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error(`Error reading reviews for ${shopSlug}:`, error);
    return [];
  }
}

// Function to add a new review for a shop
export async function addReview(review: Omit<Review, 'id' | 'date' | 'isVerified' | 'isApproved'>): Promise<Review> {
  const filePath = getReviewsFilePath(review.shopSlug);
  
  try {
    // Get existing reviews or initialize an empty array
    let reviews: Review[] = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      reviews = JSON.parse(fileContent) as Review[];
    }
    
    // Create a new review with additional fields
    const newReview: Review = {
      ...review,
      id: uuidv4(),
      date: new Date().toISOString(),
      isVerified: false, // In a real app, this would be set based on user authentication
      isApproved: true, // In a real app, this might require moderation
    };
    
    // Add the new review to the array
    reviews.push(newReview);
    
    // Write the updated reviews array back to the file
    fs.writeFileSync(filePath, JSON.stringify(reviews, null, 2));
    
    return newReview;
  } catch (error) {
    console.error(`Error adding review for ${review.shopSlug}:`, error);
    throw new Error('Failed to add review');
  }
}

// Function to get the average rating for a shop
export async function getAverageRating(shopSlug: string): Promise<{ average: number; count: number }> {
  const reviews = await getReviewsByShopSlug(shopSlug);
  
  if (reviews.length === 0) {
    return { average: 0, count: 0 };
  }
  
  // Only consider approved reviews for the average rating
  const approvedReviews = reviews.filter(review => review.isApproved);
  
  if (approvedReviews.length === 0) {
    return { average: 0, count: 0 };
  }
  
  const sum = approvedReviews.reduce((total, review) => total + review.rating, 0);
  const average = sum / approvedReviews.length;
  
  return {
    average: parseFloat(average.toFixed(1)),
    count: approvedReviews.length,
  };
}

// Function to delete a review (for moderation purposes)
export async function deleteReview(shopSlug: string, reviewId: string): Promise<boolean> {
  const filePath = getReviewsFilePath(shopSlug);
  
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let reviews = JSON.parse(fileContent) as Review[];
    
    // Filter out the review to delete
    const filteredReviews = reviews.filter(review => review.id !== reviewId);
    
    // If no reviews were removed, return false
    if (filteredReviews.length === reviews.length) {
      return false;
    }
    
    // Write the updated reviews array back to the file
    fs.writeFileSync(filePath, JSON.stringify(filteredReviews, null, 2));
    
    return true;
  } catch (error) {
    console.error(`Error deleting review ${reviewId} for ${shopSlug}:`, error);
    return false;
  }
}

// Function to update a review's approval status (for moderation purposes)
export async function updateReviewApproval(shopSlug: string, reviewId: string, isApproved: boolean): Promise<boolean> {
  const filePath = getReviewsFilePath(shopSlug);
  
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let reviews = JSON.parse(fileContent) as Review[];
    
    // Find the review to update
    const reviewIndex = reviews.findIndex(review => review.id === reviewId);
    
    if (reviewIndex === -1) {
      return false;
    }
    
    // Update the review's approval status
    reviews[reviewIndex].isApproved = isApproved;
    
    // Write the updated reviews array back to the file
    fs.writeFileSync(filePath, JSON.stringify(reviews, null, 2));
    
    return true;
  } catch (error) {
    console.error(`Error updating review ${reviewId} for ${shopSlug}:`, error);
    return false;
  }
}
