'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/find-boba-shops', label: 'Find Shops' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  // The form posts to a real URL with a real `name`, so submitting works
  // with JavaScript disabled (full page navigation to /search?q=...).
  // The onSubmit below is a progressive enhancement on top of that -
  // it intercepts the same navigation to avoid a full reload when JS
  // is available, but isn't required for search to function.
  const handleSearchSubmit = (e: FormEvent, closeMenu?: boolean) => {
    e.preventDefault()
    if (searchQuery.trim().length > 1) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      if (closeMenu) setIsMenuOpen(false)
    }
  }

  const SearchIcon = (
    <svg
      className="h-4 w-4"
      style={{ color: 'var(--ink-muted)' }}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--rule)' }}
    >
      <div className="container-custom">
        <div className="flex h-14 md:h-[72px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="relative h-8 w-8 md:h-10 md:w-10 mr-2 md:mr-3">
              <Image
                src="/images/bobacat-logo-med.png"
                alt="Discover Boba Logo"
                fill
                sizes="40px"
                className="object-cover rounded-full"
              />
            </div>
            <span
              className="text-lg md:text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
            >
              Discover Boba
            </span>
          </Link>

          {/* Desktop nav + persistent search */}
          <div className="hidden md:flex items-center gap-8 flex-1 justify-end">
            <nav className="flex items-center gap-6">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="font-medium text-sm relative py-1 transition-colors duration-motion ease-motion rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
                  style={{ color: isActive(href) ? 'var(--matcha-deep)' : 'var(--ink-muted)' }}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <form action="/search" method="GET" onSubmit={handleSearchSubmit} className="relative w-64">
              <label htmlFor="header-search-desktop" className="sr-only">
                Search boba shops
              </label>
              <input
                id="header-search-desktop"
                type="text"
                name="q"
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-control text-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--ink)',
                  border: '1px solid var(--rule)',
                }}
              />
              <button type="submit" className="absolute left-1 top-1 p-1.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]" aria-label="Search">
                {SearchIcon}
              </button>
            </form>
          </div>

          {/* Mobile nav-menu toggle - search is NOT hidden behind this,
              it lives in the always-visible row below. */}
          <button
            className="md:hidden p-1 flex-shrink-0"
            style={{ color: 'var(--ink-muted)' }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile persistent search row - always rendered, full-width,
            beneath the wordmark. Not part of the collapsible nav menu. */}
        <div className="md:hidden pb-3">
          <form action="/search" method="GET" onSubmit={(e) => handleSearchSubmit(e)} className="relative">
            <label htmlFor="header-search-mobile" className="sr-only">
              Search boba shops
            </label>
            <input
              id="header-search-mobile"
              type="text"
              name="q"
              placeholder="Search shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-control text-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
              style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--rule)' }}
            />
            <button type="submit" className="absolute left-1 top-1 p-1.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]" aria-label="Search">
              {SearchIcon}
            </button>
          </form>
        </div>

        {/* Mobile nav-link menu */}
        {isMenuOpen && (
          <nav
            className="md:hidden pb-4 flex flex-col gap-3"
            style={{ borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-medium text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
                style={{ color: isActive(href) ? 'var(--matcha-deep)' : 'var(--ink-muted)' }}
                onClick={() => setIsMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
