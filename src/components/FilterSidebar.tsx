'use client'

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { withSuspense } from '@/components/hoc/withSuspense';

interface FilterSidebarProps {
  tags: string[]
  citySlug: string
}

function FilterSidebarContent({ tags, citySlug }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get currently selected tags from URL
  const selectedTagsParam = searchParams.get('tags')
  const initialSelectedTags = selectedTagsParam ? selectedTagsParam.split(',') : []
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelectedTags);
  const [isTagListExpanded, setIsTagListExpanded] = useState(false); // Renamed for clarity
  const [isMobileFilterVisible, setIsMobileFilterVisible] = useState(false); // State for mobile visibility

  // Group tags by category (simplified approach)
  const groupedTags: Record<string, string[]> = {
    'Service Options': [],
    'Accessibility': [],
    'Features': [],
    'Other': [],
  }
  
  // Categorize tags (simplified logic)
  tags.forEach(tag => {
    if (tag.includes('delivery') || tag.includes('pickup') || tag.includes('Takeout') || tag.includes('Dine-in')) {
      groupedTags['Service Options'].push(tag)
    } else if (tag.includes('accessible') || tag.includes('Accessibility')) {
      groupedTags['Accessibility'].push(tag)
    } else if (tag.includes('selection') || tag.includes('options')) {
      groupedTags['Features'].push(tag)
    } else {
      groupedTags['Other'].push(tag)
    }
  })
  
  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }
  
  // Apply filters
  const applyFilters = () => {
    if (selectedTags.length > 0) {
      router.push(`/find-boba-shops/${citySlug}?tags=${selectedTags.join(',')}`)
    }
    setIsMobileFilterVisible(false); // Collapse after applying
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedTags([]);
    router.push(`/find-boba-shops/${citySlug}`);
    setIsMobileFilterVisible(false); // Collapse after clearing
  };

  // Display only the first 10 tags by default
  // const displayedTags = isTagListExpanded ? tags : tags.slice(0, 10); // Keep original logic if needed, but seems unused now

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* --- Mobile Toggle Button --- */}
      <button
        onClick={() => setIsMobileFilterVisible(!isMobileFilterVisible)}
        className="md:hidden w-full btn-secondary mb-4 flex justify-between items-center"
        aria-expanded={isMobileFilterVisible}
        aria-controls="filter-content"
      >
        <span>Filter Results</span>
        {/* Add a simple chevron icon */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transition-transform ${isMobileFilterVisible ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* --- Filter Content Wrapper --- */}
      <div
        id="filter-content"
        className={`${isMobileFilterVisible ? 'block' : 'hidden'} md:block`} // Logic for visibility
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Filters</h3>
          <button
            onClick={clearFilters}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          Clear All
        </button>
      </div>
      
      {/* Filter by tag categories */}
      {Object.entries(groupedTags).map(([category, categoryTags]) => (
        categoryTags.length > 0 && (
          <div key={category} className="mb-6">
            <h4 className="font-medium mb-3">{category}</h4>
            <div className="space-y-2">
              {categoryTags.map(tag => (
                <div key={tag} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`tag-${tag}`}
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`tag-${tag}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
      
      {/* Removed the old "Show More/Less" button as filters are now grouped */}
      {/* If needed, similar logic could be applied within each category */}

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={applyFilters}
          className="w-full btn-primary"
        >
          Apply Filters
        </button>
      </div>
      </div> {/* End of filter-content wrapper */}
    </div>
  );
}

// Export the component wrapped with Suspense
export default withSuspense(FilterSidebarContent);
