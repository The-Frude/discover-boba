'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { AttributeGroup } from '@/utils/data'

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
  selectedTagKeys: string[]
  attributeGroups: AttributeGroup[]
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

const focusRingClass =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]'

// The always-visible controls (search, sort, min rating, open now) plus
// the grouped attribute checkboxes pulled live from each city's real
// `about` data (utils/data.ts's getAvailableAttributeGroups) - a city with
// thin data on some dimension just doesn't render that group/item, no
// per-city special-casing needed here.
function QuickFields({
  idPrefix,
  q,
  sort,
  minRating,
  open,
  social,
  showSocialFilter,
  autoSubmit,
}: {
  idPrefix: string
  q: string
  sort: string
  minRating: string
  open: boolean
  social: boolean
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

function AttributeCheckboxGroups({
  idPrefix,
  attributeGroups,
  selectedTagKeys,
  autoSubmit,
}: {
  idPrefix: string
  attributeGroups: AttributeGroup[]
  selectedTagKeys: string[]
  autoSubmit: boolean
}) {
  const submitOnChange = autoSubmit
    ? (e: React.ChangeEvent<HTMLInputElement>) => e.currentTarget.form?.requestSubmit()
    : undefined

  if (attributeGroups.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {attributeGroups.map((group) => (
        <div key={group.group}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--ink-muted)' }}>
            {group.group}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => {
              const id = `${idPrefix}-tag-${item.key}`
              const checked = selectedTagKeys.includes(item.key)
              return (
                <label key={item.key} htmlFor={id} className="cursor-pointer">
                  <input
                    id={id}
                    type="checkbox"
                    name="tags"
                    value={item.key}
                    defaultChecked={checked}
                    onChange={submitOnChange}
                    className="peer sr-only"
                  />
                  {/* peer-checked reacts to the checkbox's live DOM state via
                      pure CSS, not a value computed at server-render time -
                      an uncontrolled checkbox's visual toggle would otherwise
                      lag a full page reload behind the actual click,
                      especially in the mobile sheet where submit is a
                      separate, later step. */}
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-pill border transition-colors duration-motion ease-motion bg-[var(--bg)] border-[var(--rule)] text-[var(--ink)] peer-checked:bg-[var(--matcha-deep)] peer-checked:border-[var(--matcha-deep)] peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--taro-deep)]`}
                  >
                    {item.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
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
      <Link href={clearAllHref} className="text-xs font-medium underline" style={{ color: 'var(--ink-muted)' }}>
        Clear all
      </Link>
    </div>
  )
}

// Shared focus-trap / Escape-to-close behavior for a <details> used as a
// sheet or dropdown. Works with plain <details> semantics with no JS at
// all (click the summary to open/close); this only adds the a11y layer on
// top once JS is available.
function useDisclosureA11y() {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const details = detailsRef.current
    const panel = panelRef.current
    if (!details || !panel) return

    function focusables(): HTMLElement[] {
      if (!panel) return []
      return Array.from(
        panel.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
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
        focusables()[0]?.focus()
      }
    }

    details.addEventListener('toggle', onToggle)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      details.removeEventListener('toggle', onToggle)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return { detailsRef, panelRef, triggerRef }
}

export default function CityFilterBar(props: CityFilterBarProps) {
  const { citySlug, cityName, resultCount, totalCount, activeChips, clearAllHref, attributeGroups, selectedTagKeys } = props
  const mobile = useDisclosureA11y()
  const desktopMore = useDisclosureA11y()

  const activeCount = activeChips.length
  const moreFiltersCount = attributeGroups.reduce((sum, g) => sum + g.items.length, 0)

  // The mobile sheet is a full-screen overlay, so it also gets a body
  // scroll lock while open - the desktop "more filters" dropdown doesn't
  // need that, it's inline.
  useEffect(() => {
    const details = mobile.detailsRef.current
    if (!details) return
    function onToggle() {
      document.body.style.overflow = details!.open ? 'hidden' : ''
    }
    details.addEventListener('toggle', onToggle)
    return () => {
      details.removeEventListener('toggle', onToggle)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {/* Desktop: compact bar with a "More filters" dropdown for the
          grouped, per-city attribute list. */}
      <form
        action={`/find-boba-shops/${citySlug}`}
        method="GET"
        className="hidden md:flex flex-col gap-3 p-4 rounded-card mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--rule)' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <QuickFields idPrefix="desktop" {...props} autoSubmit />
          {moreFiltersCount > 0 && (
            <details ref={desktopMore.detailsRef} className="relative">
              <summary
                ref={desktopMore.triggerRef}
                className={`list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-control ${focusRingClass}`}
                style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}
              >
                More filters{selectedTagKeys.length > 0 ? ` (${selectedTagKeys.length})` : ''}
              </summary>
              <div
                ref={desktopMore.panelRef}
                className="absolute left-0 top-full mt-2 z-40 w-[min(640px,90vw)] p-4 rounded-card shadow-lg max-h-[70vh] overflow-y-auto"
                style={{ background: 'var(--surface)', border: '1px solid var(--rule)' }}
              >
                <AttributeCheckboxGroups
                  idPrefix="desktop"
                  attributeGroups={attributeGroups}
                  selectedTagKeys={selectedTagKeys}
                  autoSubmit
                />
              </div>
            </details>
          )}
          <button
            type="submit"
            className={`text-sm font-semibold px-4 py-2 rounded-control text-white ${focusRingClass}`}
            style={{ background: 'var(--matcha-deep)' }}
          >
            Search
          </button>
        </div>
      </form>
      <div className="hidden md:block">
        <ActiveChips chips={activeChips} clearAllHref={clearAllHref} />
      </div>

      {/* Mobile: search stays visible; everything else (including the
          attribute groups) is behind a native <details> disclosure so it
          opens/closes without JS. JS only adds the focus trap and
          Escape-to-close on top. */}
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
            className={`flex-1 px-3 py-2 rounded-control text-sm focus:outline-none ${focusRingClass}`}
            style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--rule)' }}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-control text-sm font-semibold text-white ${focusRingClass}`}
            style={{ background: 'var(--matcha-deep)' }}
          >
            Search
          </button>
        </form>

        <ActiveChips chips={activeChips} clearAllHref={clearAllHref} />

        <details ref={mobile.detailsRef} className="relative">
          <summary
            ref={mobile.triggerRef}
            className={`list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-control w-fit ${focusRingClass}`}
            style={{ background: 'var(--surface)', border: '1px solid var(--rule)', color: 'var(--ink)' }}
          >
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </summary>
          {/* Positioned fixed only once open (details hides this natively
              when closed), so it behaves like a bottom sheet on mobile. */}
          <div
            ref={mobile.panelRef}
            className="fixed inset-0 z-[60] flex flex-col justify-end"
            style={{ background: 'rgba(30,41,59,0.4)' }}
          >
            <form
              action={`/find-boba-shops/${citySlug}`}
              method="GET"
              className="flex flex-col gap-4 p-5 rounded-t-card max-h-[85vh] overflow-y-auto"
              style={{ background: 'var(--surface)' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>
                  Filters
                </h2>
                <Link href={clearAllHref} className="text-sm underline" style={{ color: 'var(--ink-muted)' }}>
                  Clear all
                </Link>
              </div>
              <QuickFields idPrefix="mobile" {...props} autoSubmit={false} />
              <AttributeCheckboxGroups
                idPrefix="mobile"
                attributeGroups={attributeGroups}
                selectedTagKeys={selectedTagKeys}
                autoSubmit={false}
              />
              <button
                type="submit"
                className={`text-sm font-semibold px-4 py-3 rounded-control text-white ${focusRingClass}`}
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
