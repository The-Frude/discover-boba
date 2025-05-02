'use client'

import { useState, useEffect } from 'react'
import { Review } from '@/utils/reviews'

interface ReviewsListProps {
  shopSlug: string;
}

export default function ReviewsList({ shopSlug }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/reviews?shopSlug=${shopSlug}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews')
        }
        
        const data = await response.json()
        setReviews(data)
      } catch (err) {
        setError('Failed to load reviews. Please try again later.')
        console.error('Error fetching reviews:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchReviews()
  }, [shopSlug])
  
  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  // Render stars based on rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i} 
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100 p-4 rounded-md">
        {error}
      </div>
    )
  }
  
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to leave a review!</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center mb-1">
                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">{review.user_name}</span>
                {review.is_verified && (
                  <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                )}
              </div>
              <div className="flex items-center">
                {renderStars(review.rating)}
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(review.date)}
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{review.comment}</p>
        </div>
      ))}
    </div>
  )
}
