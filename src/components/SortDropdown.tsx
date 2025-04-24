'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SortDropdownProps {
  totalItems: number
}

export default function SortDropdown({ totalItems }: SortDropdownProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Get current sort option from URL or default to 'rating'
  const [sortOption, setSortOption] = useState(
    searchParams.get('sort') || 'rating'
  )
  
  // Update URL when sort option changes
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSortOption(value)
    
    // Create new URLSearchParams with current params
    const params = new URLSearchParams(searchParams.toString())
    
    // Update or add sort parameter
    params.set('sort', value)
    
    // Navigate to new URL with updated params
    router.push(`${pathname}?${params.toString()}`)
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600 dark:text-gray-300">Sort by:</span>
      <select 
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1"
        value={sortOption}
        onChange={handleSortChange}
        aria-label="Sort shops by"
      >
        <option value="rating">Rating</option>
        <option value="reviews">Reviews</option>
        <option value="name">Name</option>
      </select>
    </div>
  )
}
