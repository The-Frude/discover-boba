import { Metadata } from 'next'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { notFound } from 'next/navigation'
import { getShopsByCity, getCities, GENERIC_TAGS } from '@/utils/data'
import ShopCard from '@/components/ShopCard'
import FilterSidebar from '@/components/FilterSidebar'
import CityMapView from '@/components/CityMapView'
import Pagination from '@/components/Pagination'
import SortDropdown from '@/components/SortDropdown'
import OptimizedImage from '@/components/OptimizedImage'
import JumpToMapButton from '@/components/JumpToMapButton'
import JsonLd from '@/components/JsonLd'
import Breadcrumbs from '@/components/Breadcrumbs'
import { CITY_INTROS } from './city-intros'

// NOTE: this page reads `searchParams` (for page/tags/sort/minRating),
// which is a Next.js "Dynamic API" - it forces the whole route to render
// fresh on every request, for every URL including the plain no-query-param
// one, regardless of `generateStaticParams` above. Confirmed via
// .next/prerender-manifest.json, which has no entry at all for this route
// (contrast with sitemap.ts, which genuinely gets `initialRevalidateSeconds`
// there). A `revalidate` export here is silently ignored by Next.js - there
// is no static/ISR cache for it to apply to, so don't add one back as a fix
// for perceived staleness; it won't do anything. If this page ever stops
// reading searchParams and needs real caching again, that's when a
// revalidate export (or on-demand revalidatePath after data changes) would
// actually take effect.

// Hand-written per-city SEO copy - avoids the single shared template
// (`Best Boba Tea Shops in ${city.name}, ${city.state}`) showing up as
// identical boilerplate across all 7 pages in view-source. `{count}` in
// each entry is filled in from the live `city.shopCount` at render time,
// never hardcoded, so it can't drift as the directory grows.
const CITY_SEO: Record<string, { title: (count: number) => string; description: (count: number) => string }> = {
  atlanta: {
    title: (count) => `${count}+ Boba Tea Shops in Atlanta, GA | Discover Boba`,
    description: (count) => `Find boba tea shops across Atlanta and nearby Decatur, Duluth, and Alpharetta. Compare ratings, hours, and menus from ${count}+ bubble tea spots.`,
  },
  chicago: {
    title: (count) => `${count}+ Boba Tea Shops in Chicago, IL | Discover Boba`,
    description: (count) => `Explore boba tea shops in Chicago's Chinatown, the Argyle Street corridor, and the suburbs. Compare ratings, hours, and menus from ${count}+ bubble tea spots.`,
  },
  dallas: {
    title: (count) => `${count}+ Boba Tea Shops in Dallas, TX | Discover Boba`,
    description: (count) => `Browse boba tea shops across Dallas and suburbs like Plano, Irving, and Frisco. Compare ratings, hours, and menus from ${count}+ bubble tea spots.`,
  },
  'new-york': {
    title: (count) => `${count}+ Boba Tea Shops in New York, NY | Discover Boba`,
    description: (count) => `Find boba tea shops across all five boroughs, from Flushing to Manhattan's Chinatown. Compare ratings, hours, and menus from ${count}+ bubble tea spots.`,
  },
  philadelphia: {
    title: (count) => `${count}+ Boba Tea Shops in Philadelphia, PA | Discover Boba`,
    description: (count) => `Explore boba tea shops in Philadelphia's Chinatown, University City, and nearby South Jersey. Compare ratings and menus from ${count}+ bubble tea spots.`,
  },
  seattle: {
    title: (count) => `${count}+ Boba Tea Shops in Seattle, WA | Discover Boba`,
    description: (count) => `Browse boba tea shops from downtown Seattle to Bellevue and the Eastside suburbs. Compare ratings, hours, and menus from ${count}+ bubble tea spots.`,
  },
  washington: {
    title: (count) => `${count}+ Boba Tea Shops in Washington, D.C. | Discover Boba`,
    description: (count) => `Find boba tea shops across D.C., plus nearby Bethesda, Arlington, and Alexandria. Compare ratings, hours, and menus from ${count}+ bubble tea spots.`,
  },
}

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
  
  const seo = CITY_SEO[city.slug]
  const title = seo
    ? seo.title(city.shopCount)
    : `Best Boba Tea Shops in ${city.name}, ${city.state} | Discover Boba`
  const description = seo
    ? seo.description(city.shopCount)
    : `Find the top-rated bubble tea shops in ${city.name}, ${city.state}. Browse reviews, ratings, and details for the best boba experience.`

  return {
    title,
    description,
    keywords: `boba, bubble tea, ${city.name}, ${city.state}, milk tea, tapioca, pearls`,
    alternates: {
      // Always the clean city URL, regardless of ?page/tags/sort/minRating,
      // so paginated/filtered views aren't treated as duplicate pages.
      canonical: `/find-boba-shops/${city.slug}`,
    },
    openGraph: {
      title,
      description,
      images: city.image ? [city.image] : undefined,
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
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: city.name }]} />
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
          {CITY_INTROS[city.slug] && (
            <p className="text-gray-700 dark:text-gray-300 max-w-4xl mb-10 leading-relaxed">
              {CITY_INTROS[city.slug]}
            </p>
          )}

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
              
              {/* docs/UI-OVERHAUL-PLAN-09sep2026.md §4: auto-fill so the
                  column count responds to space rather than a fixed
                  breakpoint count. */}
              <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
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
