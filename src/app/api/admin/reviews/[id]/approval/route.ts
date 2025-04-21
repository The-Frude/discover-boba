import { NextRequest, NextResponse } from 'next/server'
import { updateReviewApproval } from '@/utils/reviews'

// PUT /api/admin/reviews/:id/approval - Update review approval status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id
    const body = await request.json()
    
    // Validate required fields
    if (!body.shopSlug || body.isApproved === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: shopSlug and isApproved' },
        { status: 400 }
      )
    }
    
    // In a real application, we would verify the user is an admin here
    
    // Update the review approval status
    const success = await updateReviewApproval(body.shopSlug, reviewId, body.isApproved)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Review not found or could not be updated' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating review approval:', error)
    return NextResponse.json(
      { error: 'Failed to update review approval' },
      { status: 500 }
    )
  }
}
