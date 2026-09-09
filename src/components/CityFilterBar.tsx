'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export interface ActiveFilterChip {
  label: string
  removeHref: string
}

export interface CityFilterBarProps {
  citySlug: string
  cityName: string
  q: string
  sort: string
  minRating: string
  delivery: boolean
  wheelchair: boolean
  social: boolean
  open: boolean
  showSocialFilter: boolean
  resultCount: number
  totalCount: number
  activeChips: ActiveFilterChip[]
  clearAllHref: string
}

const RATING_OPTIONS = [
  { label: 'Any rating', value: '' },
  { label: '3.5+ stars', value: '3.5' },
  { label: '4.0+ stars', value: '4.0' },
  { label: '4.5+ stars', value: '4.5' },
]

// Shared field markup for both the desktop bar and the mobile sheet - same
// `name`s, same GET form, just rendered twice with distinct DOM ids so
// labels stay valid in both places. Submitting either form is a plain
// browser navigation, so this all works identically with JavaScript off;
// the only JS-dependent pieces are auto-submit-on-change (desktop) and the
// sheet's focus trap / Escape handling (mobile), both pure enhancements.
function FilterFields({
  idPrefix,
  q,
  sort,
  minRating,
  delivery,
  wheelchair,
  social,
  open,
  showSocialFilter,
  autoSubmit,
}: {
  idPrefix: string
  q: string
  sort: string
  minRating: string
  delivery: boolean
  wheelchair: boolean
  social: boolean
  open: boolean
  showSocialFilter: boolean
  autoSubmit: boolean
}) {
  const submitOnChange = autoSubmit
    ? (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => e.currentTarget.form?.requestSubmit()
    : undefined

  const fieldStyle = {
    background: 'var(--surface)',
    color: 'var(--ink)',
    border: '1px solid var(--rule)',
  }
  const focusRingClass =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]'

  return (
    <>
      <div className="relative flex-1 min-w-[180px]">
        <label htmlFor={`${idPrefix}-q`} className="sr-only">
          Search within results
        </label>
        <input
          id={`${idPrefix}-q`}
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search this city's shops..."
          className={`w-full px-3 py-2 rounded-control text-sm focus:outline-none ${focusRingClass}`}
          style={fieldStyle}
        />
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor={`${idPrefix}-sort`} className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Sort
        </label>
        <select
          id={`${idPrefix}-sort`}
          name="sort"
          defaultValue={sort}
          onChange={submitOnChange}
          className={`px-2 py-2 rounded-control text-sm focus:outline-none ${focusRingClass}`}
          style={fieldStyle}
        >
          <option value="rating">Rating</option>
          <option value="reviews">Review count</option>
          <option value="name">Name</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor={`${idPrefix}-minRating`} className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Min rating
        </label>
        <select
          id={`${idPrefix}-minRating`}
          name="minRating"
          defaultValue={minRating}
          onChange={submitOnChange}
          className={`px-2 py-2 rounded-control text-sm focus:outline-none ${focusRingClass}`}
          style={fieldStyle}
        >
          {RATING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--ink)' }}>
          <input
            type="checkbox"
            name="open"
            value="now"
            defaultChecked={open}
            onChange={submitOnChange}
            className={`h-4 w-4 rounded-sm ${focusRingClass}`}
          />
          Open now
        </label>
        <label className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--ink)' }}>
          <input
            type="checkbox"
            name="delivery"
            value="1"
            defaultChecked={delivery}
            onChange={submitOnChange}
            className={`h-4 w-4 rounded-sm ${focusRingClass}`}
          />
          Delivery
        </label>
        <label className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--ink)' }}>
          <input
            type="checkbox"
            name="wheelchair"
            value="1"
            defaultChecked={wheelchair}
            onChange={submitOnChange}
            className={`h-4 w-4 rounded-sm ${focusRingClass}`}
          />
          Wheelchair accessible
        </label>
        {showSocialFilter && (
          <label className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--ink)' }}>
            <input
              type="checkbox"
              name="social"
              value="1"
              defaultChecked={social}
              onChange={submitOnChange}
              className={`h-4 w-4 rounded-sm ${focusRingClass}`}
            />
            Has social media
          </label>
        )}
      </div>
    </>
  )
}

function ActiveChips({ chips, clearAllHref }: { chips: ActiveFilterChip[]; clearAllHref: string }) {
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.removeHref}
          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-pill text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
          style={{ background: 'var(--matcha-deep)' }}
        >
          {chip.label}
          <span aria-hidden="true">&times;</span>
        </Link>
      ))}
      <Link
        href={clearAllHref}
        className="text-xs font-medium underline"
        style={{ color: 'var(--ink-muted)' }}
      >
        Clear all
      </Link>
    </div>
  )
}

export default function CityFilterBar(props: CityFilterBarProps) {
  const { citySlug, cityName, resultCount, totalCount, activeChips, clearAllHref } = props
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement>(null)

  const activeCount = activeChips.length

  useEffect(() => {
    const details = detailsRef.current
    const panel = panelRef.current
    if (!details || !panel) return

    function focusables(): HTMLElement[] {
      if (!panel) return []
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      )
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!details!.open) return
      if (e.key === 'Escape') {
        details!.open = false
        triggerRef.current?.focus()
        return
      }
      if (e.key === 'Tab') {
        const items = focusables()
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    function onToggle() {
      if (details!.open) {
        document.body.style.overflow = 'hidden'
        focusables()[0]?.focus()
      } else {
        document.body.style.overflow = ''
      }
    }

    details.addEventListener('toggle', onToggle)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      details.removeEventListener('toggle', onToggle)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [])

  const liveRegionText =
    activeCount > 0 || props.q
      ? `${resultCount} of ${totalCount} shops match your filters in ${cityName}`
      : `${resultCount} shops in ${cityName}`

  return (
    <div className="mb-6">
      <div aria-live="polite" className="sr-only">
        {liveRegionText}
      </div>

      {/* Desktop: horizontal bar */}
      <form
        action={`/find-boba-shops/${citySlug}`}
        method="GET"
        className="hidden md:flex flex-wrap items-center gap-4 p-4 rounded-card mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--rule)' }}
      >
        <FilterFields idPrefix="desktop" {...props} autoSubmit />
        <button
          type="submit"
          className="text-sm font-semibold px-4 py-2 rounded-control text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
          style={{ background: 'var(--matcha-deep)' }}
        >
          Search
        </button>
      </form>
      <div className="hidden md:block">
        <ActiveChips chips={activeChips} clearAllHref={clearAllHref} />
      </div>

      {/* Mobile: search stays visible; everything else is behind a
          native <details> disclosure so it opens/closes without JS.
          JS only adds the focus trap and Escape-to-close on top. */}
      <div className="md:hidden flex flex-col gap-3">
        <form action={`/find-boba-shops/${citySlug}`} method="GET" className="flex gap-2">
          <label htmlFor="mobile-search-only-q" className="sr-only">
            Search within results
          </label>
          <input
            id="mobile-search-only-q"
            type="text"
            name="q"
            defaultValue={props.q}
            placeholder="Search this city's shops..."
            className="flex-1 px-3 py-2 rounded-control text-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
            style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--rule)' }}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-control text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
            style={{ background: 'var(--matcha-deep)' }}
          >
            Search
          </button>
        </form>

        <ActiveChips chips={activeChips} clearAllHref={clearAllHref} />

        <details ref={detailsRef} className="relative">
          <summary
            ref={triggerRef}
            className="list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-control w-fit"
            style={{ background: 'var(--surface)', border: '1px solid var(--rule)', color: 'var(--ink)' }}
          >
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </summary>
          {/* Positioned fixed only once open (details hides this natively
              when closed), so it behaves like a bottom sheet on mobile. */}
          <div
            ref={panelRef}
            className="fixed inset-0 z-[60] flex flex-col justify-end"
            style={{ background: 'rgba(30,41,59,0.4)' }}
          >
            <form
              action={`/find-boba-shops/${citySlug}`}
              method="GET"
              className="flex flex-col gap-4 p-5 rounded-t-card max-h-[80vh] overflow-y-auto"
              style={{ background: 'var(--surface)' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>
                  Filters
                </h2>
                <Link
                  href={clearAllHref}
                  className="text-sm underline"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  Clear all
                </Link>
              </div>
              <FilterFields idPrefix="mobile" {...props} autoSubmit={false} />
              <button
                type="submit"
                className="text-sm font-semibold px-4 py-3 rounded-control text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
                style={{ background: 'var(--matcha-deep)' }}
              >
                Apply filters
              </button>
            </form>
          </div>
        </details>
      </div>
    </div>
  )
}
