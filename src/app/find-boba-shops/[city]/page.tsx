import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getShopsByCity, getCities, createSlug } from '@/utils/data'
import ShopCard from '@/components/ShopCard'
import FilterSidebar from '@/components/FilterSidebar'
import CityMapView from '@/components/CityMapView'
import Pagination from '@/components/Pagination'
import OptimizedImage from '@/components/OptimizedImage'

interface CityPageProps {
  params: {
    city: string
  }
  searchParams: {
    page?: string
    tags?: string
  }
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city: citySlug } = params
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
  const { city: citySlug } = params
  const cities = await getCities()
  const city = cities.find(c => c.slug === citySlug)
  
  if (!city) {
    notFound()
  }
  
  // Get all shops for this city
  const allShops = await getShopsByCity(city.name)
  
  // Extract all unique tags from shops
  const allTags = [...new Set(allShops.flatMap(shop => shop.tags))]
  
  // Handle tag filtering - ensure searchParams is properly awaited
  const selectedTagsParam = searchParams?.tags || ''
  const selectedTags = selectedTagsParam ? selectedTagsParam.split(',') : []
  
  // Filter shops by selected tags if any
  const filteredShops = selectedTags.length > 0
    ? allShops.filter(shop => selectedTags.some(tag => shop.tags.includes(tag)))
    : allShops
  
  // Pagination
  const itemsPerPage = 10 // Number of shops per page
  const currentPage = searchParams?.page ? parseInt(searchParams.page) : 1
  
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
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-300">Sort by:</span>
                  <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1">
                    <option value="rating">Rating</option>
                    <option value="reviews">Reviews</option>
                    <option value="name">Name</option>
                  </select>
                </div>
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
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container-custom">
          <h2 className="text-2xl font-bold mb-6">Find Boba Shops on the Map</h2>
          <CityMapView shops={filteredShops} cityName={city.name} />
        </div>
      </section>
    </main>
  )
}
