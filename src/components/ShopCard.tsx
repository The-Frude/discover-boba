import Link from 'next/link'
import { Shop, getOpenStatus } from '@/utils/data'
import ShopTile from './ShopTile'

interface ShopCardProps {
  shop: Shop
}

// Attributes confirmed populated on >=60% of shops in every city
// (docs/AUDIT.md §B) - the only ones honest enough to surface as pills.
const PILL_TAGS = ['Delivery', 'Wheelchair accessible']

export default function ShopCard({ shop }: ShopCardProps) {
  const isPremium = Boolean(shop.is_premium && shop.featured_until && new Date(shop.featured_until) > new Date())

  // Same zero-review guard as the shop detail page - avoids a 5-star badge
  // backed by "0 reviews".
  const reviewCount = shop.reviews || shop.user_ratings_total || 0
  const hasRating = reviewCount > 0 && shop.rating > 0

  const pills = PILL_TAGS.filter((tag) => shop.tags.includes(tag)).slice(0, 2)
  const openStatus = getOpenStatus(shop)
  const photo = shop.photos && shop.photos.length > 0 ? shop.photos[0] : null

  return (
    <div
      className={`group relative flex flex-row sm:flex-col gap-3 sm:gap-0 p-3 sm:p-0 rounded-card overflow-hidden transition-colors duration-motion ease-motion focus-within:border-[var(--matcha-deep)] hover:border-[var(--matcha-deep)] ${
        isPremium ? 'border-2' : 'border'
      }`}
      style={{ background: 'var(--surface)', borderColor: isPremium ? 'var(--matcha-deep)' : 'var(--rule)' }}
    >
      {/* Own `relative` wrapper so the pearl badge overlays the media
          specifically, not the whole card - it's a sibling positioned
          absolute, and would otherwise anchor to the card's own bounds. */}
      <div className="relative w-24 h-24 flex-shrink-0 sm:w-full sm:h-auto sm:flex-shrink">
        <ShopTile
          id={shop.id}
          imageUrl={photo}
          alt={shop.name}
          aspectClassName="aspect-square sm:aspect-[4/3]"
          className="w-full h-full transition-transform duration-motion ease-motion group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none"
          sizes="(max-width: 640px) 96px, (max-width: 1024px) 50vw, 33vw"
        />

        {hasRating && (
          <>
            {/* Mobile: smaller badge over the 96px square thumbnail */}
            <div
              className="flex sm:hidden absolute items-center justify-center text-white text-xs font-semibold rounded-full"
              style={{ background: 'var(--taro-deep)', width: 26, height: 26, top: 4, right: 4 }}
              aria-label={`Rated ${shop.rating.toFixed(1)} out of 5 on Google`}
            >
              {shop.rating.toFixed(1)}
            </div>
            {/* Desktop: full-size badge over the 4:3 media */}
            <div
              className="hidden sm:flex absolute items-center justify-center text-white font-semibold rounded-full"
              style={{ background: 'var(--taro-deep)', width: 40, height: 40, bottom: 8, right: 8 }}
              aria-label={`Rated ${shop.rating.toFixed(1)} out of 5 on Google`}
            >
              {shop.rating.toFixed(1)}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 min-w-0 sm:p-4">
        {isPremium && (
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--matcha-deep)' }}>
            Featured
          </p>
        )}

        <h3 className="text-lg font-semibold mb-1 truncate sm:whitespace-normal" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>
          <Link
            href={`/boba-shop/${shop.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
          >
            {shop.name}
          </Link>
        </h3>

        <p className="text-sm truncate sm:whitespace-normal" style={{ color: 'var(--ink-muted)' }}>
          {shop.formatted_address}
        </p>

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

        {pills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {pills.map((tag) => (
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
      </div>
    </div>
  )
}
