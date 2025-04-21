import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getShopBySlug, getAllTags, formatWorkingHours, createSlug } from '@/utils/data'
import MapView from '@/components/MapView'
import OptimizedImage from '@/components/OptimizedImage'
import ReviewsSection from '@/components/ReviewsSection'

interface ShopPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { slug } = params
  const shop = await getShopBySlug(slug)
  
  if (!shop) {
    return {
      title: 'Shop Not Found',
      description: 'The requested boba shop could not be found.',
    }
  }
  
  return {
    title: `${shop.name} - Boba Tea Shop in ${shop.city}, ${shop.state} | Discover Boba`,
    description: `Visit ${shop.name} in ${shop.city}, ${shop.state}. Check out their menu, hours, and reviews for the perfect bubble tea experience.`,
    keywords: `boba, bubble tea, ${shop.name}, ${shop.city}, ${shop.state}, ${shop.tags.join(', ')}`,
  }
}

export async function generateStaticParams() {
  const allTags = await getAllTags()
  
  // This would need to be implemented to get all shops
  // For now, we'll return an empty array as this would be populated
  // based on all shops across all cities
  return []
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { slug } = params
  const shop = await getShopBySlug(slug)
  
  if (!shop) {
    notFound()
  }
  
  // Group tags by category (simplified approach)
  const groupedTags: Record<string, string[]> = {
    'Service Options': [],
    'Accessibility': [],
    'Features': [],
    'Other': [],
  }
  
  // Categorize tags (simplified logic)
  shop.tags.forEach(tag => {
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
  
  // Format working hours
  const hours = shop.opening_hours?.weekday_text || []
  
  return (
    <main className="min-h-screen py-12">
      <div className="container-custom">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <Link href={`/find-boba-shops/${shop.city ? shop.city.toLowerCase() : createSlug(shop.formatted_address.split(',')[0])}`} className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 ml-1 md:ml-2">
                    {shop.city || shop.formatted_address.split(',')[0]}
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="text-gray-500 dark:text-gray-400 ml-1 md:ml-2">{shop.name}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Shop Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
              <div className="h-64 relative">
                <OptimizedImage
                  src={shop.photos?.[0] || "/images/boba-cat.jpeg"}
                  alt={shop.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 66vw"
                />
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h1 className="text-3xl font-bold mb-2 md:mb-0">{shop.name}</h1>
                  {shop.rating > 0 && (
                    <div className="flex items-center">
                      <div className="flex items-center mr-2">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            className={`w-5 h-5 ${i < Math.round(shop.rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                            fill="currentColor" 
                            viewBox="0 0 20 20" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {shop.rating.toFixed(1)} ({shop.user_ratings_total} reviews)
                      </span>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {shop.formatted_address}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {shop.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {shop.website && (
                    <a 
                      href={shop.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      Visit Website
                    </a>
                  )}
                  {shop.formatted_phone_number && (
                    <a 
                      href={`tel:${shop.formatted_phone_number.replace(/\D/g, '')}`}
                      className="btn-secondary"
                    >
                      Call
                    </a>
                  )}
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.formatted_address)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    Directions
                  </a>
                </div>
              </div>
            </div>
            
            {/* Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Hours of Operation</h2>
              {hours.length > 0 ? (
                <ul className="space-y-2">
                  {hours.map((day, index) => (
                    <li key={index} className="flex">
                      <span className="font-medium w-32">{day.split(': ')[0]}:</span>
                      <span className="text-gray-600 dark:text-gray-300">{day.split(': ')[1]}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">Hours information not available</p>
              )}
            </div>
            
            {/* Map */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Location</h2>
              <MapView 
                address={shop.formatted_address}
                name={shop.name}
              />
            </div>
            
            {/* Reviews Section */}
            <ReviewsSection shop={shop} />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Contact Information</h2>
              <ul className="space-y-3">
                {shop.formatted_phone_number && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">{shop.formatted_phone_number}</span>
                  </li>
                )}
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">{shop.formatted_address}</span>
                </li>
                {shop.website && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    <a 
                      href={shop.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {shop.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </li>
                )}
              </ul>
            </div>
            
            {/* Features */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Features</h2>
              {Object.entries(groupedTags).map(([category, tags]) => (
                tags.length > 0 && (
                  <div key={category} className="mb-4">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{category}</h3>
                    <ul className="space-y-1">
                      {tags.map((tag, index) => (
                        <li key={index} className="flex items-center text-gray-600 dark:text-gray-300">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
            
            {/* Ad Placeholder */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Advertisement</p>
              <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 mt-2">
                <p className="text-gray-400 dark:text-gray-500">Ad Space</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
