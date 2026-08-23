import { Metadata } from 'next'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getShopsByCity, getCities, GENERIC_TAGS } from '@/utils/data'
import ShopCard from '@/components/ShopCard'
import FilterSidebar from '@/components/FilterSidebar'
import CityMapView from '@/components/CityMapView'
import Pagination from '@/components/Pagination'
import SortDropdown from '@/components/SortDropdown'
import OptimizedImage from '@/components/OptimizedImage'
import JumpToMapButton from '@/components/JumpToMapButton'
import JsonLd from '@/components/JsonLd'

interface CityPageProps {
  params: {
    city: string
  }
  searchParams: {
    page?: string
    tags?: string
    sort?: string
    minRating?: string
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
    alternates: {
      // Always the clean city URL, regardless of ?page/tags/sort/minRating,
      // so paginated/filtered views aren't treated as duplicate pages.
      canonical: `/find-boba-shops/${city.slug}`,
    },
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
  
  // Count how many shops carry each tag, then drop tags every shop has
  // (e.g. "Bubble Tea", "Takeout") - they can never narrow the results,
  // so offering them as filters is just clutter.
  const tagCounts = new Map<string, number>()
  allShops.forEach(shop => {
    shop.tags.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1))
  })
  const filterableTags = Array.from(tagCounts.entries())
    .filter(([tag, count]) => count < allShops.length && !GENERIC_TAGS.includes(tag))
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }))

  const selectedTagsParam = searchParamsData?.tags || ''
  const selectedTags = selectedTagsParam ? selectedTagsParam.split(',') : []
  const minRating = searchParamsData?.minRating ? parseFloat(searchParamsData.minRating) : 0

  // A shop must match every selected filter (AND), not just one of them.
  const filteredShops = allShops.filter(shop => {
    const matchesTags = selectedTags.every(tag => shop.tags.includes(tag))
    const matchesRating = shop.rating >= minRating
    return matchesTags && matchesRating
  })
  
  // Pagination
  const itemsPerPage = 10 // Number of shops per page
  const currentPage = searchParamsData?.page ? parseInt(searchParamsData.page) : 1
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedShops = filteredShops.slice(startIndex, endIndex)

  const baseUrl = 'https://www.discoverboba.com'
  const cityUrl = `${baseUrl}/find-boba-shops/${city.slug}`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: city.name, item: cityUrl },
    ],
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: paginatedShops.map((shop, index) => ({
      '@type': 'ListItem',
      position: startIndex + index + 1,
      url: `${baseUrl}/boba-shop/${shop.slug}`,
      name: shop.name,
    })),
  }

  return (
    <main className="min-h-screen">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />

      {/* Breadcrumbs */}
      <div className="container-custom pt-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                Home
              </Link>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="text-gray-500 dark:text-gray-400 ml-1 md:ml-2">{city.name}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src={city.image || "/images/boba-cat.jpeg"}
            alt={`${city.name} Boba Shops`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
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
                  tags={filterableTags}
                  citySlug={city.slug}
                />
              </Suspense>
            </div>

            {/* Shop Listings */}
            <div className="lg:w-3/4">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold">
                  {filteredShops.length} Shops Found
                </h2>
                <div className="flex items-center gap-4">
                  <Suspense fallback={null}>
                    <SortDropdown totalItems={filteredShops.length} />
                  </Suspense>
                  <JumpToMapButton />
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
                  sort={searchParamsData?.sort}
                  minRating={searchParamsData?.minRating}
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
