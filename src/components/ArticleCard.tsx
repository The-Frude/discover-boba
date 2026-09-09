import Link from 'next/link'
import ShopTile from './ShopTile'

// Sibling of ShopCard (docs/UI-OVERHAUL-PLAN-09sep2026.md §4/§10) - same
// media treatment, tokens, and grid, but its own anatomy (title, excerpt,
// read time) and no pearl badge. Not wired into any page; articles don't
// exist yet (§10 groundwork only). URL prefix decided: /guides/[slug].

interface ArticleCardProps {
  title: string
  slug: string
  excerpt: string
  city?: string
  readTimeMinutes?: number
  imageUrl?: string | null
}

export default function ArticleCard({ title, slug, excerpt, city, readTimeMinutes, imageUrl }: ArticleCardProps) {
  return (
    <div
      className="group relative flex flex-row sm:flex-col gap-3 sm:gap-0 p-3 sm:p-0 rounded-card overflow-hidden border transition-colors duration-motion ease-motion focus-within:border-[var(--matcha-deep)] hover:border-[var(--matcha-deep)]"
      style={{ background: 'var(--surface)', borderColor: 'var(--rule)' }}
    >
      <div className="relative w-24 h-24 flex-shrink-0 sm:w-full sm:h-auto sm:flex-shrink">
        <ShopTile
          id={slug}
          imageUrl={imageUrl}
          alt={title}
          aspectClassName="aspect-square sm:aspect-[4/3]"
          className="w-full h-full transition-transform duration-motion ease-motion group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none"
          sizes="(max-width: 640px) 96px, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="flex-1 min-w-0 sm:p-4">
        {(city || readTimeMinutes) && (
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--matcha-deep)' }}>
            {[city, readTimeMinutes ? `${readTimeMinutes} min read` : null].filter(Boolean).join(' — ')}
          </p>
        )}

        <h3 className="text-lg font-semibold mb-1 truncate sm:whitespace-normal" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>
          <Link
            href={`/guides/${slug}`}
            className="after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
          >
            {title}
          </Link>
        </h3>

        <p className="text-sm line-clamp-2 sm:line-clamp-3" style={{ color: 'var(--ink-muted)' }}>
          {excerpt}
        </p>
      </div>
    </div>
  )
}
