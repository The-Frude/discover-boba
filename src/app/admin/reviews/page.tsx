'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Review } from '@/utils/reviews'
import { withSuspense } from '@/components/hoc/withSuspense'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Loading component for Suspense fallback
function ReviewsPageLoading() {
  return (
    <div className="container-custom py-12">
      <h1 className="text-2xl font-bold mb-6">Review Moderation</h1>
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    </div>
  )
}

// Main component content
function AdminReviewsContent() {
  const [reviews, setReviews] = useState<Record<string, Review[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shopSlugs, setShopSlugs] = useState<string[]>([])
  const [selectedShop, setSelectedShop] = useState<string>('')
  
  // Fetch all shop slugs
  useEffect(() => {
    const fetchShopSlugs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/shops')
        
        if (!response.ok) {
          throw new Error('Failed to fetch shops')
        }
        
        const data = await response.json()
        setShopSlugs(data.map((shop: any) => shop.slug))
        
        if (data.length > 0) {
          setSelectedShop(data[0].slug)
        }
      } catch (err) {
        setError('Failed to load shops. Please try again later.')
        console.error('Error fetching shops:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchShopSlugs()
  }, [])
  
  // Fetch reviews for selected shop
  useEffect(() => {
    if (!selectedShop) return
    
    const fetchReviews = async () => {
      try {
        setLoading(true)
        
        // In a real application, this would be an admin API endpoint
        // For now, we'll use the public endpoint
        const response = await fetch(`/api/reviews?shopSlug=${selectedShop}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews')
        }
        
        const data = await response.json()
        setReviews(prev => ({
          ...prev,
          [selectedShop]: data
        }))
      } catch (err) {
        setError('Failed to load reviews. Please try again later.')
        console.error('Error fetching reviews:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (!reviews[selectedShop]) {
      fetchReviews()
    }
  }, [selectedShop, reviews])
  
  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  // Handle review approval toggle
  const handleApprovalToggle = async (review: Review) => {
    try {
      // In a real application, this would be an admin API endpoint
      const response = await fetch(`/api/admin/reviews/${review.id}/approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopSlug: review.shop_slug,
          is_approved: !review.is_approved,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update review approval status')
      }
      
      // Update the local state
      setReviews(prev => {
        const updatedReviews = [...prev[review.shop_slug]]
        const reviewIndex = updatedReviews.findIndex(r => r.id === review.id)
        
        if (reviewIndex !== -1) {
          updatedReviews[reviewIndex] = {
            ...updatedReviews[reviewIndex],
            is_approved: !updatedReviews[reviewIndex].is_approved,
          }
        }
        
        return {
          ...prev,
          [review.shop_slug]: updatedReviews,
        }
      })
    } catch (error) {
      console.error('Error updating review approval:', error)
      alert('Failed to update review approval status')
    }
  }
  
  // Handle review deletion
  const handleDelete = async (review: Review) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }
    
    try {
      // In a real application, this would be an admin API endpoint
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopSlug: review.shop_slug,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete review')
      }
      
      // Update the local state
      setReviews(prev => {
        const updatedReviews = prev[review.shop_slug].filter(r => r.id !== review.id)
        
        return {
          ...prev,
          [review.shop_slug]: updatedReviews,
        }
      })
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    }
  }
  
  if (loading && Object.keys(reviews).length === 0) {
    return (
      <div className="container-custom py-12">
        <h1 className="text-2xl font-bold mb-6">Review Moderation</h1>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }
  
  if (error && Object.keys(reviews).length === 0) {
    return (
      <div className="container-custom py-12">
        <h1 className="text-2xl font-bold mb-6">Review Moderation</h1>
        <div className="bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100 p-4 rounded-md">
          {error}
        </div>
      </div>
    )
  }
  
  return (
    <ProtectedRoute adminOnly>
      <div className="container-custom py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Review Moderation</h1>
          <Link href="/admin/dashboard" className="btn-secondary">
            Back to Admin Dashboard
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <label htmlFor="shopSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Shop
            </label>
            <select
              id="shopSelect"
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {shopSlugs.map((slug) => (
                <option key={slug} value={slug}>
                  {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          
          {selectedShop && reviews[selectedShop] ? (
            reviews[selectedShop].length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rating
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Comment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reviews[selectedShop].map((review) => (
                      <tr key={review.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{review.user_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{review.user_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{review.rating} / 5</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">{review.comment}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(review.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.is_approved ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                            {review.is_approved ? 'Approved' : 'Not Approved'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleApprovalToggle(review)}
                            className={`mr-2 ${review.is_approved ? 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300' : 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300'}`}
                          >
                            {review.is_approved ? 'Unapprove' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleDelete(review)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No reviews found for this shop.</p>
              </div>
            )
          ) : (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md text-yellow-800 dark:text-yellow-100">
          <h3 className="font-semibold mb-2">Note:</h3>
          <p>
            This is a simplified admin interface for demonstration purposes. In a production environment, this page would be protected by authentication and would have more robust moderation features.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Export the wrapped component with custom loading component
export default withSuspense(AdminReviewsContent, <ReviewsPageLoading />);
