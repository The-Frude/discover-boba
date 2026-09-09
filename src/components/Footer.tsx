import Link from 'next/link'
import { getCities, getLastUpdated } from '@/utils/data'

interface FooterLink {
  label: string
  href: string
}

interface FooterGroup {
  title: string
  links: FooterLink[]
}

// Searches for tags that are actually well-populated across the dataset
// (docs/AUDIT.md) - not aspirational drink flavors that never made it
// into the source data (Matcha/Taro/Fruit Teas/Smoothies all resolve to
// zero shops today, see the per-tag count check run for Phase 4).
const POPULAR_SEARCH_LINKS: FooterLink[] = [
  { label: 'Boba shops with delivery', href: '/search?q=Delivery' },
  { label: 'Wheelchair accessible boba shops', href: `/search?q=${encodeURIComponent('Wheelchair accessible')}` },
  { label: 'Boba shops with coffee', href: '/search?q=Coffee' },
  { label: 'Vegan boba options', href: `/search?q=${encodeURIComponent('Vegan options')}` },
]

// Empty until Phase 10 (articles) ships - the column below only renders
// when this array is non-empty, so adding entries here is the entire
// integration point, no layout changes needed.
const GUIDES_LINKS: FooterLink[] = []

export default async function Footer() {
  const currentYear = new Date().getFullYear()
  const [lastUpdated, cities] = await Promise.all([getLastUpdated(), getCities()])

  const groups: FooterGroup[] = [
    {
      title: 'Company',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Find Shops', href: '/find-boba-shops' },
        { label: 'FAQ', href: '/faq' },
        { label: 'About Us', href: '/about-us' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Cities',
      links: cities.map((city) => ({ label: city.name, href: `/find-boba-shops/${city.slug}` })),
    },
    {
      title: 'Popular Searches',
      links: POPULAR_SEARCH_LINKS,
    },
    {
      title: 'Guides',
      links: GUIDES_LINKS,
    },
  ]

  return (
    <footer style={{ background: 'var(--ink)', color: '#FFFFFF' }}>
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Discover Boba
            </h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Your guide to finding boba tea shops across major U.S. cities. Compare ratings, hours,
              and menus to find your next favorite bubble tea spot.
            </p>
            {/* Real provenance, not a trust badge (CLAUDE.md). */}
            {lastUpdated && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Rating and hours from Google, last checked{' '}
                {lastUpdated.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
              </p>
            )}
          </div>

          {groups
            .filter((group) => group.links.length > 0)
            .map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold mb-4 tracking-normal">{group.title}</h3>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm transition-colors duration-motion ease-motion rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>

        <div
          className="mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            &copy; {currentYear} Discover Boba. All rights reserved. Design consultation by{' '}
            <a
              href="https://broadleafagency.com/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)] rounded-sm"
            >
              Broadleaf Agency
            </a>
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/privacy-policy"
              className="text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)] rounded-sm"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)] rounded-sm"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies-policy"
              className="text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)] rounded-sm"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Cookie Policy
            </Link>
            <Link
              href="/dashboard"
              className="text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)] rounded-sm"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Shop Owner Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
