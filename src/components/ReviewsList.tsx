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
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetchReviews = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/reviews?shopSlug=${shopSlug}`)

        if (!response.ok) {
          throw new Error('Failed to fetch reviews')
        }

        const data = await response.json()
        if (!cancelled) setReviews(data)
      } catch (err) {
        if (!cancelled) setError("This shop's reviews didn't load.")
        console.error('Error fetching reviews:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchReviews()
    return () => { cancelled = true }
  }, [shopSlug, retryKey])
  
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
    // Skeleton matches a real review item's shape (name line, stars+date
    // line, two-line comment) so nothing shifts when real content arrives.
    return (
      <div className="space-y-6" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 animate-pulse motion-reduce:animate-none">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100 p-4 rounded-md flex items-center justify-between gap-4">
        <span>{error}</span>
        <button
          onClick={() => setRetryKey((k) => k + 1)}
          className="text-sm font-semibold underline flex-shrink-0"
        >
          Try again
        </button>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to leave one.</p>
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
