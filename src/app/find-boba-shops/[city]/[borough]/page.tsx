import { Metadata } from 'next'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { notFound } from 'next/navigation'
import {
  getCities,
  getShopsByCityAndBorough,
  getOpenStatus,
  getAvailableAttributeGroups,
  shopHasAttribute,
  FILTER_ATTRIBUTES,
  NYC_BOROUGHS,
  MIN_BOROUGH_SHOP_COUNT,
  createSlug,
  Shop,
} from '@/utils/data'
import ShopCard from '@/components/ShopCard'
import CityFilterBar, { ActiveFilterChip } from '@/components/CityFilterBar'
import CityMapView from '@/components/CityMapView'
import Pagination from '@/components/Pagination'
import JumpToMapButton from '@/components/JumpToMapButton'
import JsonLd from '@/components/JsonLd'
import Breadcrumbs from '@/components/Breadcrumbs'
import MapErrorFallback from '@/components/MapErrorFallback'
import CityIntroText from '@/components/CityIntroText'
import { BOROUGH_INTROS } from './borough-intros'

// NYC-only for now (SEO audit Priority 5, phase 1) - see docs/
// discoverboba-seo-audit-plan-14sep2026.md. This route file is generic
// (Next.js dynamic segments aren't city-specific), so every handler below
// explicitly guards city.slug === 'new-york' rather than relying on
// generateStaticParams alone to keep other cities out.
const BOROUGH_BY_SLUG = new Map(NYC_BOROUGHS.map((b) => [createSlug(b), b]))

const BOROUGH_SEO: Record<string, { title: (count: number) => string; description: (count: number) => string }> = {
  manhattan: {
    title: (count) => `${count}+ Boba Tea Shops in Manhattan, NY | Discover Boba`,
    description: (count) => `Find boba tea shops in Manhattan, from Chinatown to the Upper West Side. Compare ratings, hours, and menus from ${count}+ bubble tea spots.`,
  },
  queens: {
    title: (count) => `${count}+ Boba Tea Shops in Queens, NY | Discover Boba`,
    description: (count) => `Browse boba tea shops in Queens, including Astoria, Long Island City, and Flushing. Compare ratings and hours from ${count}+ bubble tea spots.`,
  },
  brooklyn: {
    title: () => `Boba Tea Shops in Brooklyn, NY | Discover Boba`,
    description: () => `Boba tea shops in Brooklyn, New York - browse listings as this part of the directory grows.`,
  },
  bronx: {
    title: () => `Boba Tea Shops in the Bronx, NY | Discover Boba`,
    description: () => `Boba tea shops in the Bronx, New York - this part of the directory is still being built out.`,
  },
  'staten-island': {
    title: () => `Boba Tea Shops in Staten Island, NY | Discover Boba`,
    description: () => `Boba tea shops in Staten Island, New York - this part of the directory is still being built out.`,
  },
}

const SOCIAL_FILTER_EXCLUDED_CITIES = new Set(['washington'])

interface BoroughPageProps {
  params: {
    city: string
    borough: string
  }
  searchParams: {
    page?: string
    sort?: string
    minRating?: string
    tags?: string | string[]
    social?: string
    open?: string
    q?: string
  }
}

async function resolveBorough(citySlug: string, boroughSlug: string) {
  if (citySlug !== 'new-york') return null
  const boroughName = BOROUGH_BY_SLUG.get(boroughSlug)
  if (!boroughName) return null
  const cities = await getCities()
  const city = cities.find((c) => c.slug === citySlug)
  if (!city) return null
  return { city, boroughName, boroughSlug }
}

export async function generateMetadata({ params, searchParams }: BoroughPageProps): Promise<Metadata> {
  const { city: citySlug, borough: boroughSlug } = await Promise.resolve(params)
  const resolved = await resolveBorough(citySlug, boroughSlug)

  if (!resolved) {
    return { title: 'Borough Not Found', description: 'The requested borough could not be found.' }
  }

  const { city, boroughName } = resolved
  const shops = await getShopsByCityAndBorough(city.name, boroughName)
  const seo = BOROUGH_SEO[boroughSlug]
  const title = seo ? seo.title(shops.length) : `Boba Tea Shops in ${boroughName}, NY | Discover Boba`
  const description = seo
    ? seo.description(shops.length)
    : `Find boba tea shops in ${boroughName}, part of the New York metro area.`

  const searchParamsData = await Promise.resolve(searchParams)
  const hasNonDefaultParams = Object.values(searchParamsData || {}).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  )

  // Same noindex-but-crawlable pattern used for filtered city-page URLs
  // (docs/discoverboba-seo-audit-plan-14sep2026.md Priority 3), plus a
  // second reason to noindex here: a borough below MIN_BOROUGH_SHOP_COUNT
  // is real but too thin to be worth indexing yet.
  const isThin = shops.length < MIN_BOROUGH_SHOP_COUNT

  return {
    title,
    description,
    keywords: `boba, bubble tea, ${boroughName}, New York, milk tea, tapioca, pearls`,
    alternates: {
      canonical: `/find-boba-shops/new-york/${boroughSlug}`,
    },
    ...(hasNonDefaultParams || isThin ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description },
  }
}

export async function generateStaticParams() {
  return [...BOROUGH_BY_SLUG.keys()].map((borough) => ({ city: 'new-york', borough }))
}

export default async function BoroughPage({ params, searchParams }: BoroughPageProps) {
  const { city: citySlug, borough: boroughSlug } = await Promise.resolve(params)
  const resolved = await resolveBorough(citySlug, boroughSlug)

  if (!resolved) {
    notFound()
  }

  const { city, boroughName } = resolved

  const searchParamsData = await Promise.resolve(searchParams)
  const allShops = await getShopsByCityAndBorough(city.name, boroughName, searchParamsData?.sort || 'rating')

  const showSocialFilter = !SOCIAL_FILTER_EXCLUDED_CITIES.has(city.slug)

  // Filter floor is computed against THIS borough's shops, not the whole
  // city's, so the panel never offers a dimension with zero matches here.
  const attributeGroups = getAvailableAttributeGroups(allShops)
  const availableAttributesByKey = new Map(
    attributeGroups.flatMap((group) => group.items.map((item) => [item.key, item] as const))
  )
  const attributeByKey = new Map(FILTER_ATTRIBUTES.map((attr) => [attr.key, attr] as const))

  const q = (searchParamsData?.q || '').trim()
  const sort = searchParamsData?.sort || 'rating'
  const minRatingParam = searchParamsData?.minRating || ''
  const minRating = minRatingParam ? parseFloat(minRatingParam) : 0
  const rawTags = searchParamsData?.tags
  const requestedTagKeys = Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : []
  const selectedTagKeys = requestedTagKeys.filter((key) => availableAttributesByKey.has(key))
  const wantsSocial = showSocialFilter && searchParamsData?.social === '1'
  const wantsOpenNow = searchParamsData?.open === 'now'

  const hasSocialPresence = (shop: Shop) =>
    Boolean(shop.facebook || shop.instagram || shop.twitter || shop.tiktok)

  const filteredShops = allShops.filter((shop) => {
    if (minRating > 0 && shop.rating < minRating) return false
    if (wantsSocial && !hasSocialPresence(shop)) return false
    if (wantsOpenNow && getOpenStatus(shop)?.isOpen !== true) return false
    if (selectedTagKeys.some((key) => {
      const attr = attributeByKey.get(key)
      return !attr || !shopHasAttribute(shop, attr)
    })) return false
    if (q && !shop.name.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const basePath = `/find-boba-shops/new-york/${boroughSlug}`

  const buildBoroughHref = (overrides: {
    tags?: string[]
    sort?: string
    minRating?: string
    social?: string
    open?: string
    q?: string
  }) => {
    const params = new URLSearchParams()
    const { tags: tagsOverride, ...rest } = overrides
    const next: Record<string, string | undefined> = {
      sort: sort !== 'rating' ? sort : undefined,
      minRating: minRatingParam || undefined,
      social: wantsSocial ? '1' : undefined,
      open: wantsOpenNow ? 'now' : undefined,
      q: q || undefined,
      ...rest,
    }
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    ;(tagsOverride ?? selectedTagKeys).forEach((key) => params.append('tags', key))
    const qs = params.toString()
    return `${basePath}${qs ? `?${qs}` : ''}`
  }

  const activeChips: ActiveFilterChip[] = []
  if (minRatingParam) activeChips.push({ label: `${minRatingParam}+ stars`, removeHref: buildBoroughHref({ minRating: undefined }) })
  if (wantsOpenNow) activeChips.push({ label: 'Open now', removeHref: buildBoroughHref({ open: undefined }) })
  selectedTagKeys.forEach((key) => {
    const attr = attributeByKey.get(key)
    if (!attr) return
    activeChips.push({
      label: attr.label,
      removeHref: buildBoroughHref({ tags: selectedTagKeys.filter((k) => k !== key) }),
    })
  })
  if (wantsSocial) activeChips.push({ label: 'Has social media', removeHref: buildBoroughHref({ social: undefined }) })
  if (q) activeChips.push({ label: `"${q}"`, removeHref: buildBoroughHref({ q: undefined }) })

  const clearAllHref = basePath

  const itemsPerPage = 10
  const currentPage = searchParamsData?.page ? parseInt(searchParamsData.page) : 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedShops = filteredShops.slice(startIndex, endIndex)

  const baseUrl = 'https://www.discoverboba.com'
  const cityUrl = `${baseUrl}/find-boba-shops/${city.slug}`
  const boroughUrl = `${baseUrl}${basePath}`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: city.name, item: cityUrl },
      { '@type': 'ListItem', position: 3, name: boroughName, item: boroughUrl },
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

      <div className="container-custom pt-6">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: city.name, href: `/find-boba-shops/${city.slug}` },
            { name: boroughName },
          ]}
        />
      </div>

      <section className="relative h-[32vh] min-h-[240px] flex items-center justify-center" style={{ background: 'var(--ink)' }}>
        <div className="container-custom relative z-10 text-center text-white">
          <h1
            className="text-4xl md:text-5xl mb-4"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
          >
            Boba Shops in {boroughName}
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Discover {filteredShops.length} bubble tea shops in {boroughName}
          </p>
        </div>
      </section>

      <section className="py-12" style={{ background: 'var(--bg)' }}>
        <div className="container-custom">
          <div className="flex flex-col">
            {BOROUGH_INTROS[boroughSlug] && (
              <div className="order-2 md:order-none">
                <CityIntroText citySlug={boroughSlug} text={BOROUGH_INTROS[boroughSlug]} />
              </div>
            )}

            <div className="order-1 md:order-none">
              <CityFilterBar
                citySlug={boroughSlug}
                basePath={basePath}
                cityName={boroughName}
                q={q}
                sort={sort}
                minRating={minRatingParam}
                selectedTagKeys={selectedTagKeys}
                attributeGroups={attributeGroups}
                social={wantsSocial}
                open={wantsOpenNow}
                showSocialFilter={showSocialFilter}
                resultCount={filteredShops.length}
                totalCount={allShops.length}
                activeChips={activeChips}
                clearAllHref={clearAllHref}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h2 className="text-2xl" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--ink)' }}>
              {filteredShops.length} Shops Found
            </h2>
            {filteredShops.length > 0 && <JumpToMapButton />}
          </div>

          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {paginatedShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>

          <Suspense fallback={<div className="flex justify-center mt-8">Loading pagination...</div>}>
            <Pagination
              totalItems={filteredShops.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              citySlug={boroughSlug}
              basePath={basePath}
              sort={sort !== 'rating' ? sort : undefined}
              minRating={minRatingParam || undefined}
              tags={selectedTagKeys}
              social={wantsSocial}
              open={wantsOpenNow}
              q={q || undefined}
            />
          </Suspense>

          {filteredShops.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--ink)' }}>
                {allShops.length === 0 ? `No shops listed in ${boroughName} yet` : 'No shops match your filters'}
              </h3>
              <p className="mb-4" style={{ color: 'var(--ink-muted)' }}>
                {allShops.length === 0 ? (
                  <>Check the <a href={`/find-boba-shops/${city.slug}`} className="underline">full {city.name} listing</a> for shops across every borough.</>
                ) : (
                  <>
                    {q
                      ? `No shops match "${q}"${activeChips.length > 1 ? ' with your selected filters' : ''} in ${boroughName}.`
                      : `No shops match these filters in ${boroughName}.`}{' '}
                    Clear filters to see all {allShops.length} shops.
                  </>
                )}
              </p>
              {allShops.length > 0 && (
                <a href={clearAllHref} className="btn-primary">
                  Clear filters
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {filteredShops.length > 0 && (
        <section id="map-section" className="py-8" style={{ background: 'var(--bg)', borderTop: '1px solid var(--rule)' }}>
          <div className="container-custom">
            <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-muted)' }}>
              Find boba shops near you on the map
            </h2>
            <ErrorBoundary fallback={<MapErrorFallback />}>
              <CityMapView shops={filteredShops} cityName={boroughName} />
            </ErrorBoundary>
          </div>
        </section>
      )}
    </main>
  )
}
