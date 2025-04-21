import { NextRequest, NextResponse } from 'next/server'
import { addReview, getReviewsByShopSlug } from '@/utils/reviews'
import { getShopBySlug } from '@/utils/data'

// POST /api/reviews - Add a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['shopId', 'shopSlug', 'userName', 'userEmail', 'rating', 'comment']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }
    
    // Validate rating is between 1 and 5
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }
    
    // Verify the shop exists
    const shop = await getShopBySlug(body.shopSlug)
    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }
    
    // Add the review
    const newReview = await addReview({
      shopId: body.shopId,
      shopSlug: body.shopSlug,
      userName: body.userName,
      userEmail: body.userEmail,
      rating: body.rating,
      comment: body.comment,
    })
    
    return NextResponse.json(newReview, { status: 201 })
  } catch (error) {
    console.error('Error adding review:', error)
    return NextResponse.json(
      { error: 'Failed to add review' },
      { status: 500 }
    )
  }
}

// GET /api/reviews?shopSlug=shop-slug - Get reviews for a shop
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shopSlug = searchParams.get('shopSlug')
    
    if (!shopSlug) {
      return NextResponse.json(
        { error: 'Missing required parameter: shopSlug' },
        { status: 400 }
      )
    }
    
    // Verify the shop exists
    const shop = await getShopBySlug(shopSlug)
    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }
    
    // Get the reviews
    const reviews = await getReviewsByShopSlug(shopSlug)
    
    // Only return approved reviews to the client
    const approvedReviews = reviews.filter(review => review.isApproved)
    
    return NextResponse.json(approvedReviews)
  } catch (error) {
    console.error('Error getting reviews:', error)
    return NextResponse.json(
      { error: 'Failed to get reviews' },
      { status: 500 }
    )
  }
}
