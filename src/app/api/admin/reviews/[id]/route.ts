import { NextRequest, NextResponse } from 'next/server'
import { deleteReview } from '@/utils/reviews'

// DELETE /api/admin/reviews/:id - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id
    const body = await request.json()
    
    // Validate required fields
    if (!body.shopSlug) {
      return NextResponse.json(
        { error: 'Missing required field: shopSlug' },
        { status: 400 }
      )
    }
    
    // In a real application, we would verify the user is an admin here
    
    // Delete the review
    const success = await deleteReview(body.shopSlug, reviewId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Review not found or could not be deleted' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
