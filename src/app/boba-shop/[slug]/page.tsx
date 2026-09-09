import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getShopBySlug, getShopsByCity, getAllTags, formatWorkingHours, getOpenStatus, parseOpeningHoursSpec, GENERIC_TAGS } from '@/utils/data'
import OptimizedImage from '@/components/OptimizedImage'
import ShopCard from '@/components/ShopCard'
import ReviewsSection from '@/components/ReviewsSection'
import JsonLd from '@/components/JsonLd'
import Breadcrumbs from '@/components/Breadcrumbs'

const SITE_URL = 'https://www.discoverboba.com'

// generateStaticParams() returns [] (no shop is pre-built), so without this
// each shop page gets cached indefinitely per-URL after its first visit -
// confirmed via .next/prerender-manifest.json and by X-Vercel-Cache: HIT
// with a climbing Age header in production - with nothing anywhere ever
// calling revalidatePath to bust it. Data here (rating, description, hours,
// website/phone) is refreshed by scripts outside of a deploy, so a cached
// page can silently go stale until the next redeploy. Forcing dynamic
// rendering matches how /find-boba-shops/[city] already behaves (always
// live, no caching) rather than leaving this route's staleness posture to
// accident. See docs/AUDIT.md §D for the full investigation.
export const dynamic = 'force-dynamic'

interface ShopPageProps {
  params: {
    slug: string
  }
}

const removeTrailingComma = (str: string) => (str.endsWith(',') ? str.slice(0, -1) : str)

// Maps a shop's city (which is frequently a suburb in the source data) to
// the metro-area page it actually appears on, so the breadcrumb links
// somewhere real instead of a 404 for a suburb with no city page of its own.
function getMainCity(cityName: string, address: string): { name: string; path: string } {
  let mainCityName = cityName;
  let mainCityPath = cityName.toLowerCase();

  if (cityName === "Washington" || address.includes("Washington DC")) {
    return { name: "Washington", path: "washington" };
  }

  const nyBoroughs = ['Queens', 'Brooklyn', 'Bronx', 'Manhattan', 'Staten Island'];
  if (cityName === 'York' ||
      mainCityPath === 'york' ||
      nyBoroughs.includes(cityName) ||
      address.includes('New York') ||
      address.includes('NY')) {
    return { name: "New York", path: "new-york" };
  }

  const citySuburbMap = [
    { suburb: 'Decatur', mainCity: 'Atlanta', path: 'atlanta' },
    { suburb: 'Marietta', mainCity: 'Atlanta', path: 'atlanta' },
    { suburb: 'Alpharetta', mainCity: 'Atlanta', path: 'atlanta' },
    { suburb: 'Duluth', mainCity: 'Atlanta', path: 'atlanta' },
    { suburb: 'Sandy Springs', mainCity: 'Atlanta', path: 'atlanta' },
    { suburb: 'Roswell', mainCity: 'Atlanta', path: 'atlanta' },

    { suburb: 'Evanston', mainCity: 'Chicago', path: 'chicago' },
    { suburb: 'Oak Park', mainCity: 'Chicago', path: 'chicago' },
    { suburb: 'Naperville', mainCity: 'Chicago', path: 'chicago' },
    { suburb: 'Schaumburg', mainCity: 'Chicago', path: 'chicago' },

    { suburb: 'Plano', mainCity: 'Dallas', path: 'dallas' },
    { suburb: 'Irving', mainCity: 'Dallas', path: 'dallas' },
    { suburb: 'Arlington TX', mainCity: 'Dallas', path: 'dallas' },
    { suburb: 'Frisco', mainCity: 'Dallas', path: 'dallas' },
    { suburb: 'Richardson', mainCity: 'Dallas', path: 'dallas' },

    { suburb: 'Camden', mainCity: 'Philadelphia', path: 'philadelphia' },
    { suburb: 'Cherry Hill', mainCity: 'Philadelphia', path: 'philadelphia' },
    { suburb: 'King of Prussia', mainCity: 'Philadelphia', path: 'philadelphia' },

    { suburb: 'Bellevue', mainCity: 'Seattle', path: 'seattle' },
    { suburb: 'Redmond', mainCity: 'Seattle', path: 'seattle' },
    { suburb: 'Kirkland', mainCity: 'Seattle', path: 'seattle' },
    { suburb: 'Renton', mainCity: 'Seattle', path: 'seattle' },

    { suburb: 'Arlington VA', mainCity: 'Washington', path: 'washington' },
    { suburb: 'Alexandria', mainCity: 'Washington', path: 'washington' },
    { suburb: 'Bethesda', mainCity: 'Washington', path: 'washington' },
    { suburb: 'Silver Spring', mainCity: 'Washington', path: 'washington' },
  ];

  const exactMatch = citySuburbMap.find(item =>
    item.suburb.toLowerCase() === cityName.toLowerCase()
  );

  if (exactMatch) {
    return { name: exactMatch.mainCity, path: exactMatch.path };
  }

  for (const mapping of citySuburbMap) {
    if (mapping.suburb === 'Arlington VA' && address.includes('Arlington') &&
        (address.includes('VA') || address.includes('Virginia'))) {
      return { name: mapping.mainCity, path: mapping.path };
    }
    else if (mapping.suburb === 'Arlington TX' && address.includes('Arlington') &&
            (address.includes('TX') || address.includes('Texas'))) {
      return { name: mapping.mainCity, path: mapping.path };
    }
    else if (mapping.suburb !== 'Arlington VA' && mapping.suburb !== 'Arlington TX' &&
            address.includes(mapping.suburb)) {
      return { name: mapping.mainCity, path: mapping.path };
    }
  }

  return { name: mainCityName, path: mainCityPath };
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  // Await params before accessing its properties
  const awaitedParams = await params;
  const shop = await getShopBySlug(awaitedParams.slug);
  
  if (!shop) {
    return {
      title: 'Shop Not Found',
      description: 'The requested boba shop could not be found.',
    }
  }
  
  // Prefer the per-shop authored meta title/description when present,
  // falling back to the generic template for shops not yet processed.
  const title = shop.meta_title && shop.meta_title.trim()
    ? shop.meta_title.trim()
    : `${shop.name} - Boba Tea Shop in ${shop.city}, ${shop.state} | Discover Boba`
  const description = shop.meta_description && shop.meta_description.trim()
    ? shop.meta_description.trim()
    : `Visit ${shop.name} in ${shop.city}, ${shop.state}. Check out their menu, hours, and reviews for the perfect bubble tea experience.`

  return {
    title,
    description,
    keywords: `boba, bubble tea, ${shop.name}, ${shop.city}, ${shop.state}, ${shop.tags.join(', ')}`,
    alternates: {
      canonical: `/boba-shop/${shop.slug}`,
    },
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
  // Await params before accessing its properties
  const awaitedParams = await params;
  const shop = await getShopBySlug(awaitedParams.slug);
  
  if (!shop) {
    notFound()
  }
  
  // Distinguishing tags only - same rule as ShopCard, drops the handful of
  // tags every shop carries (Bubble Tea, Takeout, etc.) since they add
  // nothing on a page that's already titled "boba shop."
  const distinguishingTags = shop.tags.filter((tag) => !GENERIC_TAGS.includes(tag))

  // user_ratings_total is frequently 0 in the source data even when rating
  // is populated - resolve the real count so we never show a star rating
  // backed by zero reviews.
  const reviewCount = shop.reviews || shop.user_ratings_total || 0

  // Format working hours from working_hours column
  let hours: string[] = [];
  if (shop.opening_hours?.weekday_text) {
    hours = shop.opening_hours.weekday_text;
  } else if (shop.working_hours) {
    hours = formatWorkingHours(shop.working_hours);
  }
  const todayIndex = (new Date().getDay() + 6) % 7 // 0 = Monday, matching Google's weekday_text order
  const todayHours = hours[todayIndex]
  const openStatus = getOpenStatus(shop)

  // docs/UI-OVERHAUL-PLAN-09sep2026.md §Phase 7: real enriched or CSV-
  // sourced copy only - generateShopBlurb()'s templated filler doesn't
  // count as content worth a whole section, so shops without either just
  // skip straight to the facts panel instead of showing thin boilerplate.
  const realDescription = (shop.description_enriched && shop.description_enriched.trim())
    || (shop.description && shop.description.trim())
    || ''

  const hasSocial = Boolean(shop.facebook || shop.instagram || shop.twitter || shop.tiktok)
  const isPremiumActive = Boolean(shop.is_premium && shop.featured_until && new Date(shop.featured_until) > new Date())
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.formatted_address)}`

  // Resolve the breadcrumb's city name/path once so the visible breadcrumb
  // and the BreadcrumbList JSON-LD can't drift out of sync with each other.
  const initialCityName = shop.city || shop.formatted_address.split(',')[0];
  const mainCity = getMainCity(initialCityName, shop.formatted_address);
  const breadcrumbCityName = removeTrailingComma(mainCity.name);
  const breadcrumbCityPath = removeTrailingComma(mainCity.path);

  const shopUrl = `${SITE_URL}/boba-shop/${shop.slug}`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: breadcrumbCityName, item: `${SITE_URL}/find-boba-shops/${breadcrumbCityPath}` },
      { '@type': 'ListItem', position: 3, name: shop.name, item: shopUrl },
    ],
  }

  const localBusinessJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: shop.name,
    url: shopUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: shop.formatted_address,
      addressLocality: shop.city,
      addressRegion: shop.state,
    },
  }
  if (shop.formatted_phone_number) localBusinessJsonLd.telephone = shop.formatted_phone_number
  if (shop.photos && shop.photos.length > 0) localBusinessJsonLd.image = shop.photos[0]
  const openingHoursSpec = parseOpeningHoursSpec(hours)
  if (openingHoursSpec.length > 0) localBusinessJsonLd.openingHoursSpecification = openingHoursSpec
  // Never emit a rating with a zero review count - matches the Priority 2 fix.
  if (reviewCount > 0 && shop.rating > 0) {
    localBusinessJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: shop.rating,
      reviewCount,
    }
  }

  // Nearby shops: same metro city, tier/premium-sorted like the city page,
  // just excluding this shop and capped at 6 real, crawlable cards.
  const cityShops = await getShopsByCity(shop.city)
  const nearbyShops = cityShops.filter((s) => s.id !== shop.id).slice(0, 6)

  const SocialLinks = hasSocial && (
    <div className="flex items-center gap-3">
      {shop.facebook && (
        <a href={shop.facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-muted)' }} aria-label={`${shop.name} on Facebook`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
          </svg>
        </a>
      )}
      {shop.instagram && (
        <a href={shop.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-muted)' }} aria-label={`${shop.name} on Instagram`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </a>
      )}
      {shop.twitter && (
        <a href={shop.twitter} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-muted)' }} aria-label={`${shop.name} on Twitter`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
          </svg>
        </a>
      )}
      {shop.tiktok && (
        <a href={shop.tiktok} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-muted)' }} aria-label={`${shop.name} on TikTok`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z"/>
          </svg>
        </a>
      )}
    </div>
  )

  const outlinedActionClass =
    'inline-flex items-center justify-center px-4 py-2 rounded-control text-sm font-semibold transition-colors duration-motion ease-motion focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]'

  return (
    <main className="min-h-screen py-8 md:py-12">
      <JsonLd data={localBusinessJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className="container-custom max-w-3xl">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: breadcrumbCityName, href: `/find-boba-shops/${breadcrumbCityPath}` },
              { name: shop.name },
            ]}
          />
        </div>

        {/* Header block - no hero image unless a real photo exists; a
            hero-scale generated tile would read as a placeholder. */}
        {shop.photos && shop.photos.length > 0 && (
          <div className="relative w-full h-56 md:h-72 rounded-card overflow-hidden mb-5">
            <OptimizedImage
              src={shop.photos[0]}
              alt={shop.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        {isPremiumActive && (
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--matcha-deep)' }}>
            Featured listing
          </p>
        )}

        <h1 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--ink)' }}>
          {shop.name}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mb-1">
          {reviewCount > 0 && shop.rating > 0 ? (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center text-white font-semibold rounded-full flex-shrink-0"
                style={{ background: 'var(--taro-deep)', width: 44, height: 44 }}
                aria-label={`Rated ${shop.rating.toFixed(1)} out of 5 on Google`}
              >
                {shop.rating.toFixed(1)}
              </div>
              <a
                href={shop.reviews_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
                style={{ color: 'var(--ink-muted)' }}
              >
                {reviewCount} reviews on Google
              </a>
            </div>
          ) : (
            <a href="#reviews" className="text-sm underline" style={{ color: 'var(--ink-muted)' }}>
              No reviews yet — be the first to review!
            </a>
          )}
        </div>

        <p style={{ color: 'var(--ink-muted)' }}>{breadcrumbCityName}, {shop.state}</p>

        {openStatus && (
          <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: 'var(--ink-muted)' }}>
            <span
              aria-hidden="true"
              className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: openStatus.isOpen ? 'var(--matcha-deep)' : 'var(--ink-muted)' }}
            />
            <span>
              {openStatus.label === 'Closed today'
                ? 'Closed today'
                : `${openStatus.isOpen ? 'Open now' : 'Closed'} · ${openStatus.label}`}
            </span>
          </p>
        )}

        {/* Action row - Directions always available (address always exists);
            everything else only renders when the data behind it exists. */}
        <div className="flex flex-wrap gap-3 mt-5 mb-8">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={outlinedActionClass}
            style={{ background: 'var(--matcha-deep)', color: '#FFFFFF' }}
          >
            Directions
          </a>
          {shop.formatted_phone_number && (
            <a
              href={`tel:${shop.formatted_phone_number.replace(/\D/g, '')}`}
              className={outlinedActionClass}
              style={{ border: '1px solid var(--border-control)', color: 'var(--ink)' }}
            >
              Call
            </a>
          )}
          {shop.website && (
            <a
              href={shop.website}
              target="_blank"
              rel="noopener noreferrer"
              className={outlinedActionClass}
              style={{ border: '1px solid var(--border-control)', color: 'var(--ink)' }}
            >
              Website
            </a>
          )}
          {shop.menu_link && (
            <a
              href={shop.menu_link}
              target="_blank"
              rel="noopener noreferrer"
              className={outlinedActionClass}
              style={{ border: '1px solid var(--border-control)', color: 'var(--ink)' }}
            >
              Menu
            </a>
          )}
          {isPremiumActive && shop.featured_order_url ? (
            <a
              href={shop.featured_order_url}
              target="_blank"
              rel="noopener noreferrer"
              className={outlinedActionClass}
              style={{ border: '1px solid var(--border-control)', color: 'var(--ink)' }}
            >
              Order Now
            </a>
          ) : shop.order_links && (
            <a
              href={shop.order_links}
              target="_blank"
              rel="noopener noreferrer"
              className={outlinedActionClass}
              style={{ border: '1px solid var(--border-control)', color: 'var(--ink)' }}
            >
              Order Now
            </a>
          )}
          {(shop.reservation_links || shop.booking_appointment_link) && (
            <a
              href={shop.reservation_links || shop.booking_appointment_link}
              target="_blank"
              rel="noopener noreferrer"
              className={outlinedActionClass}
              style={{ border: '1px solid var(--border-control)', color: 'var(--ink)' }}
            >
              Book a Table
            </a>
          )}
        </div>

        {/* Facts panel - what people came for, above the prose. */}
        <div className="rounded-card p-6 mb-8" style={{ background: 'var(--surface)', border: '1px solid var(--rule)' }}>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <dt className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Hours</dt>
              <dd style={{ color: 'var(--ink-muted)' }}>
                {hours.length > 0 ? (
                  <>
                    <p className="text-sm mb-2">
                      {todayHours ? todayHours.split(': ').slice(1).join(': ') || todayHours : 'Not listed today'}
                    </p>
                    <details>
                      <summary className="text-sm cursor-pointer underline" style={{ color: 'var(--matcha-deep)' }}>
                        See full week
                      </summary>
                      <ul className="mt-2 space-y-1 text-sm">
                        {hours.map((day, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="font-medium w-24 flex-shrink-0">{day.split(': ')[0]}</span>
                            <span>{day.split(': ')[1]}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </>
                ) : (
                  <p className="text-sm">Hours not listed</p>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Address</dt>
              <dd className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  {shop.formatted_address}
                </a>
              </dd>
            </div>

            {shop.formatted_phone_number && (
              <div>
                <dt className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Phone</dt>
                <dd className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                  <a href={`tel:${shop.formatted_phone_number.replace(/\D/g, '')}`} className="underline">
                    {shop.formatted_phone_number}
                  </a>
                </dd>
              </div>
            )}

            {shop.email && (
              <div>
                <dt className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Email</dt>
                <dd className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                  <a href={`mailto:${shop.email}`} className="underline">{shop.email}</a>
                </dd>
              </div>
            )}

            {hasSocial && (
              <div>
                <dt className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Social</dt>
                <dd>{SocialLinks}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Description - real content only (enriched or CSV-sourced). No
            section at all when neither exists; the facts panel above
            already carries the page. */}
        {realDescription && (
          <div className="mb-8">
            <h2 className="text-xl mb-3" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--ink)' }}>
              About {shop.name}
            </h2>
            <p style={{ color: 'var(--ink-muted)' }}>{realDescription}</p>
          </div>
        )}

        {distinguishingTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {distinguishingTags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold px-2.5 py-1 rounded-pill"
                style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--rule)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Provenance - real trust, not a badge. */}
        {shop.updated_at && (
          <p className="text-xs mb-8" style={{ color: 'var(--ink-muted)' }}>
            Rating and hours from Google, last checked{' '}
            {new Date(shop.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        )}

        {/* Reviews Section */}
        <ReviewsSection shop={shop} />

        {/* Nearby shops - crawlable links back into the city, genuinely
            useful to a reader still deciding. */}
        {nearbyShops.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--ink)' }}>
                Nearby boba shops in {breadcrumbCityName}
              </h2>
              <Link href={`/find-boba-shops/${breadcrumbCityPath}`} className="text-sm underline flex-shrink-0" style={{ color: 'var(--matcha-deep)' }}>
                View all shops in {breadcrumbCityName}
              </Link>
            </div>
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {nearbyShops.map((nearbyShop) => (
                <ShopCard key={nearbyShop.id} shop={nearbyShop} />
              ))}
            </div>
          </div>
        )}

        {/* Related reading slot (docs/UI-OVERHAUL-PLAN-09sep2026.md §10) -
            reserved for Phase 10 guides. No guide content exists yet, so
            intentionally nothing renders here today. */}
      </div>
    </main>
  )
}
