import Link from 'next/link'

export interface BreadcrumbItem {
  name: string
  href?: string // omitted for the current page
}

// Visual breadcrumb only - the BreadcrumbList JSON-LD stays generated
// independently on each page (docs/UI-OVERHAUL-PLAN-09sep2026.md
// guardrail #1), so this component must never be the source of truth
// for schema, only for what's rendered on screen.
export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <svg
                  className="w-3 h-3 mx-1"
                  style={{ color: 'var(--ink-muted)' }}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                </svg>
              )}
              {isLast || !item.href ? (
                <span aria-current={isLast ? 'page' : undefined} style={{ color: 'var(--ink-muted)' }}>
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors duration-motion ease-motion rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
                  style={{ color: 'var(--ink)' }}
                >
                  {item.name}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
