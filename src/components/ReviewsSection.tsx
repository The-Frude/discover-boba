'use client'

import { useState } from 'react'
import { Shop } from '@/utils/data'
import ReviewsList from './ReviewsList'
import ReviewForm from './ReviewForm'

interface ReviewsSectionProps {
  shop: Shop;
}

export default function ReviewsSection({ shop }: ReviewsSectionProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const handleReviewSubmitted = () => {
    // Refresh the reviews list
    setRefreshKey(prev => prev + 1)
    // Hide the review form
    setShowReviewForm(false)
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl font-bold">Customer Reviews</h2>
        {!showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="mt-2 md:mt-0 btn-primary"
          >
            Write a Review
          </button>
        )}
      </div>
      
      {showReviewForm ? (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Share Your Experience</h3>
          <ReviewForm 
            shop={shop} 
            onReviewSubmitted={handleReviewSubmitted} 
          />
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowReviewForm(false)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      
      <div className="mt-6">
        <ReviewsList key={refreshKey} shopSlug={shop.slug} />
      </div>
    </div>
  )
}
