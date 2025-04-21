'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  citySlug: string
  selectedTags?: string[]
}

export default function Pagination({ 
  totalItems, 
  itemsPerPage, 
  currentPage, 
  citySlug,
  selectedTags = []
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  // If there's only one page, don't show pagination
  if (totalPages <= 1) {
    return null
  }
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    
    // Always show first page
    pages.push(1)
    
    // Calculate range around current page
    let startPage = Math.max(2, currentPage - 1)
    let endPage = Math.min(totalPages - 1, currentPage + 1)
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push('...')
    }
    
    // Add pages in range
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pages.push('...')
    }
    
    // Always show last page if more than one page
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }
  
  // Generate URL for a specific page
  const getPageUrl = (page: number) => {
    let url = `/find-boba-shops/${citySlug}?page=${page}`
    
    // Add tags if any
    if (selectedTags.length > 0) {
      url += `&tags=${selectedTags.join(',')}`
    }
    
    return url
  }
  
  const pageNumbers = getPageNumbers()
  
  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center space-x-2">
        {/* Previous button */}
        {currentPage > 1 ? (
          <Link
            href={getPageUrl(currentPage - 1)}
            className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <span className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed">
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        )}
        
        {/* Page numbers */}
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-700 dark:text-gray-300">
              ...
            </span>
          ) : (
            <Link
              key={`page-${page}`}
              href={getPageUrl(page as number)}
              className={`px-3 py-2 rounded-md ${
                currentPage === page
                  ? 'bg-primary-600 text-white font-medium'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </Link>
          )
        ))}
        
        {/* Next button */}
        {currentPage < totalPages ? (
          <Link
            href={getPageUrl(currentPage + 1)}
            className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <span className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed">
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </nav>
    </div>
  )
}
