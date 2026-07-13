'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { withSuspense } from '@/components/hoc/withSuspense';

interface TagOption {
  tag: string
  count: number
}

interface FilterSidebarProps {
  tags: TagOption[]
  citySlug: string
}

// Maps known tags to a display category. Anything not listed here falls
// back to "More Filters" so new/unexpected tags still show up somewhere.
const TAG_CATEGORIES: Record<string, string> = {
  'Coffee': 'Menu & Dietary',
  'Vegetarian options': 'Menu & Dietary',
  'Vegan options': 'Menu & Dietary',
  'Gluten-free options': 'Menu & Dietary',
  'Organic': 'Menu & Dietary',
  'Fruit Teas': 'Menu & Dietary',
  'Matcha': 'Menu & Dietary',
  'Taro': 'Menu & Dietary',
  'Smoothies': 'Menu & Dietary',
  'Slushies': 'Menu & Dietary',
  'Delivery': 'Service',
  'No-contact delivery': 'Service',
  'Curbside pickup': 'Service',
  'Accepts credit cards': 'Service',
  'Wheelchair accessible': 'Accessibility & Amenities',
  'Family-friendly': 'Accessibility & Amenities',
  'Outdoor seating': 'Accessibility & Amenities',
  'Indoor seating': 'Accessibility & Amenities',
  'Free Wi-Fi': 'Accessibility & Amenities',
  'Parking available': 'Accessibility & Amenities',
}

const CATEGORY_ORDER = ['Menu & Dietary', 'Service', 'Accessibility & Amenities', 'More Filters']

const RATING_OPTIONS = [
  { label: 'Any rating', value: '' },
  { label: '4.5+ stars', value: '4.5' },
  { label: '4.0+ stars', value: '4.0' },
  { label: '3.5+ stars', value: '3.5' },
]

function FilterSidebarContent({ tags, citySlug }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMobileFilterVisible, setIsMobileFilterVisible] = useState(false);

  const selectedTagsParam = searchParams.get('tags')
  const selectedTags = selectedTagsParam ? selectedTagsParam.split(',') : []
  const minRating = searchParams.get('minRating') || ''
  const hasActiveFilters = selectedTags.length > 0 || minRating !== ''

  // Group tags into display categories, preserving each tag's count.
  const groupedTags: Record<string, TagOption[]> = {}
  tags.forEach(({ tag, count }) => {
    const category = TAG_CATEGORIES[tag] || 'More Filters'
    groupedTags[category] = groupedTags[category] || []
    groupedTags[category].push({ tag, count })
  })

  const navigate = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString())
    mutate(params)
    params.delete('page') // any filter change invalidates the current page
    const qs = params.toString()
    router.push(`/find-boba-shops/${citySlug}${qs ? `?${qs}` : ''}`)
  }

  const toggleTag = (tag: string) => {
    navigate(params => {
      const next = selectedTags.includes(tag)
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag]
      if (next.length > 0) {
        params.set('tags', next.join(','))
      } else {
        params.delete('tags')
      }
    })
  }

  const setRating = (value: string) => {
    navigate(params => {
      if (value) {
        params.set('minRating', value)
      } else {
        params.delete('minRating')
      }
    })
  }

  const clearFilters = () => {
    navigate(params => {
      params.delete('tags')
      params.delete('minRating')
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* --- Mobile Toggle Button --- */}
      <button
        onClick={() => setIsMobileFilterVisible(!isMobileFilterVisible)}
        className="md:hidden w-full btn-secondary mb-4 flex justify-between items-center"
        aria-expanded={isMobileFilterVisible}
        aria-controls="filter-content"
      >
        <span>Filter Results{hasActiveFilters ? ` (${selectedTags.length + (minRating ? 1 : 0)})` : ''}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transition-transform ${isMobileFilterVisible ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div
        id="filter-content"
        className={`${isMobileFilterVisible ? 'block' : 'hidden'} md:block`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {minRating && (
              <button
                onClick={() => setRating('')}
                className="tag inline-flex items-center gap-1 hover:bg-primary-200 dark:hover:bg-primary-800"
              >
                {minRating}+ stars
                <span aria-hidden="true">&times;</span>
              </button>
            )}
            {selectedTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="tag inline-flex items-center gap-1 hover:bg-primary-200 dark:hover:bg-primary-800"
              >
                {tag}
                <span aria-hidden="true">&times;</span>
              </button>
            ))}
          </div>
        )}

        {/* Rating filter */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Rating</h4>
          <div className="space-y-2">
            {RATING_OPTIONS.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`rating-${option.value || 'any'}`}
                  name="minRating"
                  checked={minRating === option.value}
                  onChange={() => setRating(option.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <label htmlFor={`rating-${option.value || 'any'}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Tag filters by category */}
        {CATEGORY_ORDER.map(category => {
          const categoryTags = groupedTags[category]
          if (!categoryTags || categoryTags.length === 0) return null
          return (
            <div key={category} className="mb-6">
              <h4 className="font-medium mb-3">{category}</h4>
              <div className="space-y-2">
                {categoryTags.map(({ tag, count }) => (
                  <div key={tag} className="flex items-center justify-between">
                    <div className="flex items-center">
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
                    <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {tags.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No additional filters available for this city.</p>
        )}
      </div>
    </div>
  );
}

export default withSuspense(FilterSidebarContent);
