import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { notFound } from 'next/navigation'
import { getShopsByCity, getCities, createSlug } from '@/utils/data'
import ShopCard from '@/components/ShopCard'
import FilterSidebar from '@/components/FilterSidebar'
import CityMapView from '@/components/CityMapView'
import Pagination from '@/components/Pagination'
import OptimizedImage from '@/components/OptimizedImage'
import JumpToMapButton from '@/components/JumpToMapButton'

interface CityPageProps {
  params: {
    city: string
  }
  searchParams: {
    page?: string
    tags?: string
    sort?: string
  }
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const paramsData = await Promise.resolve(params)
  const { city: citySlug } = paramsData
  const cities = await getCities()
  const city = cities.find(c => c.slug === citySlug)
  
  if (!city) {
    return {
      title: 'City Not Found',
      description: 'The requested city could not be found.',
    }
  }
  
  return {
    title: `Best Boba Tea Shops in ${city.name}, ${city.state} | Discover Boba`,
    description: `Find the top-rated bubble tea shops in ${city.name}, ${city.state}. Browse reviews, ratings, and details for the best boba experience.`,
    keywords: `boba, bubble tea, ${city.name}, ${city.state}, milk tea, tapioca, pearls`,
  }
}

export async function generateStaticParams() {
  const cities = await getCities()
  
  return cities.map(city => ({
    city: city.slug,
  }))
}

export default async function CityPage({ params, searchParams }: CityPageProps) {
  // Ensure params is properly awaited
  const paramsData = await Promise.resolve(params)
  const { city: citySlug } = paramsData
  const cities = await getCities()
  const city = cities.find(c => c.slug === citySlug)
  
  if (!city) {
    notFound()
  }
  
  // Handle tag filtering - ensure searchParams is properly awaited
  const searchParamsData = await Promise.resolve(searchParams)
  
  // Get all shops for this city with optional sorting
  const allShops = await getShopsByCity(city.name, searchParamsData?.sort || 'rating')
  
  // Extract all unique tags from shops
  const allTags = [...new Set(allShops.flatMap(shop => shop.tags))]
  const selectedTagsParam = searchParamsData?.tags || ''
  const selectedTags = selectedTagsParam ? selectedTagsParam.split(',') : []
  
  // Filter shops by selected tags if any
  const filteredShops = selectedTags.length > 0
    ? allShops.filter(shop => selectedTags.some(tag => shop.tags.includes(tag)))
    : allShops
  
  // Pagination
  const itemsPerPage = 10 // Number of shops per page
  const currentPage = searchParamsData?.page ? parseInt(searchParamsData.page) : 1
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedShops = filteredShops.slice(startIndex, endIndex)
  
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src={city.image || "/images/boba-cat.jpeg"}
            alt={`${city.name} Boba Shops`}
            fill
            priority
            className="object-cover brightness-50"
            sizes="100vw"
          />
        </div>
        <div className="container-custom relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Boba Shops in {city.name}
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Discover {filteredShops.length} bubble tea shops in {city.name}
          </p>
        </div>
      </section>

      {/* Shop Listings */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Sidebar */}
            <div className="lg:w-1/4">
              <Suspense fallback={<div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">Loading filters...</div>}>
                <FilterSidebar 
                  tags={allTags} 
                  citySlug={city.slug} 
                />
              </Suspense>
            </div>
            
            {/* Shop Listings */}
            <div className="lg:w-3/4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {filteredShops.length} Shops Found
                </h2>
                <JumpToMapButton />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedShops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
              
              {/* Pagination */}
              <Suspense fallback={<div className="flex justify-center mt-8">Loading pagination...</div>}>
                <Pagination 
                  totalItems={filteredShops.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  citySlug={city.slug}
                  selectedTags={selectedTags}
                />
              </Suspense>
              
              {filteredShops.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-medium mb-2">No shops found</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Try adjusting your filters or check back later.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section id="map-section" className="py-12 bg-white dark:bg-gray-800">
        <div className="container-custom">
          <h2 className="text-2xl font-bold mb-6">Find Boba Shops on the Map</h2>
          <ErrorBoundary 
            fallback={
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                  Map failed to load
                </h3>
                <p className="text-red-700 dark:text-red-300">
                  We couldn't load the map view. Please try refreshing the page.
                </p>
              </div>
            }
          >
            <CityMapView shops={filteredShops} cityName={city.name} />
          </ErrorBoundary>
        </div>
      </section>
    </main>
  )
}
