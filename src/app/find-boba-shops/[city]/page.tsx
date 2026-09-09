import { Metadata } from 'next'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { notFound } from 'next/navigation'
import { getShopsByCity, getCities, getOpenStatus, Shop } from '@/utils/data'
import ShopCard from '@/components/ShopCard'
import CityFilterBar, { ActiveFilterChip } from '@/components/CityFilterBar'
import CityMapView from '@/components/CityMapView'
import Pagination from '@/components/Pagination'
import OptimizedImage from '@/components/OptimizedImage'
import JumpToMapButton from '@/components/JumpToMapButton'
import JsonLd from '@/components/JsonLd'
import Breadcrumbs from '@/components/Breadcrumbs'
import MapErrorFallback from '@/components/MapErrorFallback'
import { CITY_INTROS } from './city-intros'

// docs/UI-OVERHAUL-PLAN-09sep2026.md §Phase 5: filters are curated per
// dimension, not "every tag that isn't universal" - Rating, review count,
// Open now, Delivery, and Wheelchair accessible clear the 60%-populated
// bar in all 7 cities. Social media presence clears it everywhere except
// Washington (54%, recomputed in docs/AUDIT.md), so it's the one filter
// gated per city.
const SOCIAL_FILTER_EXCLUDED_CITIES = new Set(['washington'])

// CACHING STRATEGY (landed here in Phase 6, per docs/UI-OVERHAUL-PLAN-09sep2026.md
// §7's caching gate): this route is, and stays, fully dynamic - always
// rendered fresh, no ISR, no ambient cache. That's not a gap to fix; it's the
// deliberate choice for the highest-traffic template on a site that has
// served stale/inconsistent content from this exact route three times before.
// Freshness wins over the cost of a cache miss on every request.
//
// Mechanically: this page reads `searchParams` (for page/sort/minRating/
// delivery/wheelchair/social/open/q), which is a Next.js "Dynamic API" - it
// forces the whole route to render fresh on every request, for every URL
// including the plain no-query-param one, regardless of `generateStaticParams`
// above. Confirmed via .next/prerender-manifest.json, which has no entry at
// all for this route (contrast with sitemap.ts, which genuinely gets
// `initialRevalidateSeconds` there). A `revalidate` export here is silently
// ignored by Next.js - there is no static/ISR cache for it to apply to, so
// don't add one back as a fix for perceived staleness; it won't do anything.
// If this page ever stops reading searchParams and needs real caching again,
// that's when a revalidate export (or on-demand revalidatePath after data
// changes) would actually take effect.

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
    sort?: string
    minRating?: string
    delivery?: string
    wheelchair?: string
    social?: string
    open?: string
    q?: string
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
      // Always the clean city URL, regardless of any filter/sort/search
      // query params, so filtered views aren't treated as duplicate pages.
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
  
  // Handle filtering - ensure searchParams is properly awaited
  const searchParamsData = await Promise.resolve(searchParams)

  // Get all shops for this city with optional sorting
  const allShops = await getShopsByCity(city.name, searchParamsData?.sort || 'rating')

  const showSocialFilter = !SOCIAL_FILTER_EXCLUDED_CITIES.has(city.slug)

  const q = (searchParamsData?.q || '').trim()
  const sort = searchParamsData?.sort || 'rating'
  const minRatingParam = searchParamsData?.minRating || ''
  const minRating = minRatingParam ? parseFloat(minRatingParam) : 0
  const wantsDelivery = searchParamsData?.delivery === '1'
  const wantsWheelchair = searchParamsData?.wheelchair === '1'
  const wantsSocial = showSocialFilter && searchParamsData?.social === '1'
  const wantsOpenNow = searchParamsData?.open === 'now'

  const hasSocialPresence = (shop: Shop) =>
    Boolean(shop.facebook || shop.instagram || shop.twitter || shop.tiktok)

  // A shop must match every active filter (AND), not just one of them.
  const filteredShops = allShops.filter((shop) => {
    if (minRating > 0 && shop.rating < minRating) return false
    if (wantsDelivery && !shop.tags.includes('Delivery')) return false
    if (wantsWheelchair && !shop.tags.includes('Wheelchair accessible')) return false
    if (wantsSocial && !hasSocialPresence(shop)) return false
    if (wantsOpenNow && getOpenStatus(shop)?.isOpen !== true) return false
    if (q && !shop.name.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  // Chips reflect only filters actually driving the current result set -
  // each removeHref drops just that one param so the chip is a real,
  // working link with no client JS required.
  const buildCityHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const next: Record<string, string | undefined> = {
      sort: sort !== 'rating' ? sort : undefined,
      minRating: minRatingParam || undefined,
      delivery: wantsDelivery ? '1' : undefined,
      wheelchair: wantsWheelchair ? '1' : undefined,
      social: wantsSocial ? '1' : undefined,
      open: wantsOpenNow ? 'now' : undefined,
      q: q || undefined,
      ...overrides,
    }
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    const qs = params.toString()
    return `/find-boba-shops/${city.slug}${qs ? `?${qs}` : ''}`
  }

  const activeChips: ActiveFilterChip[] = []
  if (minRatingParam) activeChips.push({ label: `${minRatingParam}+ stars`, removeHref: buildCityHref({ minRating: undefined }) })
  if (wantsOpenNow) activeChips.push({ label: 'Open now', removeHref: buildCityHref({ open: undefined }) })
  if (wantsDelivery) activeChips.push({ label: 'Delivery', removeHref: buildCityHref({ delivery: undefined }) })
  if (wantsWheelchair) activeChips.push({ label: 'Wheelchair accessible', removeHref: buildCityHref({ wheelchair: undefined }) })
  if (wantsSocial) activeChips.push({ label: 'Has social media', removeHref: buildCityHref({ social: undefined }) })
  if (q) activeChips.push({ label: `"${q}"`, removeHref: buildCityHref({ q: undefined }) })

  const clearAllHref = `/find-boba-shops/${city.slug}`

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
          <h1
            className="text-4xl md:text-5xl mb-4"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
          >
            Boba Shops in {city.name}
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Discover {filteredShops.length} bubble tea shops in {city.name}
          </p>
        </div>
      </section>

      {/* Shop Listings */}
      <section className="py-12" style={{ background: 'var(--bg)' }}>
        <div className="container-custom">
          {CITY_INTROS[city.slug] && (
            <p className="max-w-4xl mb-10 leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              {CITY_INTROS[city.slug]}
            </p>
          )}

          <CityFilterBar
            citySlug={city.slug}
            cityName={city.name}
            q={q}
            sort={sort}
            minRating={minRatingParam}
            delivery={wantsDelivery}
            wheelchair={wantsWheelchair}
            social={wantsSocial}
            open={wantsOpenNow}
            showSocialFilter={showSocialFilter}
            resultCount={filteredShops.length}
            totalCount={allShops.length}
            activeChips={activeChips}
            clearAllHref={clearAllHref}
          />

          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h2 className="text-2xl" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--ink)' }}>
              {filteredShops.length} Shops Found
            </h2>
            <JumpToMapButton />
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
              sort={sort !== 'rating' ? sort : undefined}
              minRating={minRatingParam || undefined}
              delivery={wantsDelivery}
              wheelchair={wantsWheelchair}
              social={wantsSocial}
              open={wantsOpenNow}
              q={q || undefined}
            />
          </Suspense>

          {filteredShops.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--ink)' }}>No shops match your filters</h3>
              <p className="mb-4" style={{ color: 'var(--ink-muted)' }}>
                {q
                  ? `No shops match "${q}"${activeChips.length > 1 ? ' with your selected filters' : ''} in ${city.name}.`
                  : `No shops match these filters in ${city.name}.`}{' '}
                Clear filters to see all {allShops.length} shops.
              </p>
              <a href={clearAllHref} className="btn-primary">
                Clear filters
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Map - kept per owner direction (2026-09-09): unobtrusive, last on
          the page, lazy-loaded via IntersectionObserver in CityMapView so it
          never costs a Maps API load unless a visitor actually scrolls this
          far. Deliberately quieter styling than the listings above it - this
          is a reference tool, not the page's main job. */}
      <section id="map-section" className="py-8" style={{ background: 'var(--bg)', borderTop: '1px solid var(--rule)' }}>
        <div className="container-custom">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-muted)' }}>
            Find boba shops near you on the map
          </h2>
          <ErrorBoundary fallback={<MapErrorFallback />}>
            <CityMapView shops={filteredShops} cityName={city.name} />
          </ErrorBoundary>
        </div>
      </section>

      {/* Related reading slot (docs/UI-OVERHAUL-PLAN-09sep2026.md §10) -
          reserved for Phase 10 guides. No guide content or ArticleCard
          usage exists yet, so intentionally nothing renders here today;
          this comment is the insertion point for that phase. */}
    </main>
  )
}
