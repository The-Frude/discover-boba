'use client'

import { useState, FormEvent } from 'react'
import { Shop } from '@/utils/data'

interface ReviewFormProps {
  shop: Shop;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ shop, onReviewSubmitted }: ReviewFormProps) {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    rating: 5,
    comment: '',
  })
  
  const [formStatus, setFormStatus] = useState<{
    submitting: boolean;
    submitted: boolean;
    success: boolean;
    message: string;
  }>({
    submitting: false,
    submitted: false,
    success: false,
    message: '',
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value
    }))
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.user_name || !formData.user_email || !formData.comment) {
      setFormStatus({
        submitting: false,
        submitted: true,
        success: false,
        message: 'Please fill out all required fields.'
      })
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.user_email)) {
      setFormStatus({
        submitting: false,
        submitted: true,
        success: false,
        message: 'Please enter a valid email address.'
      })
      return
    }
    
    try {
      setFormStatus({
        ...formStatus,
        submitting: true,
        message: 'Submitting your review...'
      })
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopSlug: shop.slug,
          user_name: formData.user_name,
          user_email: formData.user_email,
          rating: formData.rating,
          comment: formData.comment,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit review')
      }
      
      // Reset form
      setFormData({
        user_name: '',
        user_email: '',
        rating: 5,
        comment: '',
      })
      
      // Show success message
      setFormStatus({
        submitting: false,
        submitted: true,
        success: true,
        message: 'Thank you for your review! It has been submitted successfully.'
      })
      
      // Notify parent component that a review was submitted
      onReviewSubmitted()
    } catch (error) {
      console.error('Error submitting review:', error)
      setFormStatus({
        submitting: false,
        submitted: true,
        success: false,
        message: error instanceof Error ? error.message : 'There was an error submitting your review. Please try again.'
      })
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formStatus.submitted && (
        <div className={`p-4 rounded-md ${formStatus.success ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
          {formStatus.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="user_name"
            name="user_name"
            value={formData.user_name}
            onChange={handleChange}
            required
            disabled={formStatus.submitting}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="user_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="user_email"
            name="user_email"
            value={formData.user_email}
            onChange={handleChange}
            required
            disabled={formStatus.submitting}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Your email will not be published.
          </p>
        </div>
      </div>
      
      <div>
        <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
              disabled={formStatus.submitting}
              className="focus:outline-none"
            >
              <svg 
                className={`w-8 h-8 ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'} cursor-pointer hover:text-yellow-400`}
                fill="currentColor" 
                viewBox="0 0 20 20" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {formData.rating} out of 5 stars
          </span>
        </div>
      </div>
      
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="comment"
          name="comment"
          value={formData.comment}
          onChange={handleChange}
          required
          disabled={formStatus.submitting}
          rows={4}
          placeholder="Share your experience at this boba shop..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        ></textarea>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="terms"
          required
          disabled={formStatus.submitting}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          I agree to the <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">Terms and Conditions</a> <span className="text-red-500">*</span>
        </label>
      </div>
      
      <div>
        <button
          type="submit"
          disabled={formStatus.submitting}
          className="w-full md:w-auto btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {formStatus.submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  )
}
