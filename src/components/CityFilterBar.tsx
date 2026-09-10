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

// Always non-auto-submitting: both the desktop modal and the mobile sheet
// now batch every checkbox change and only apply on "Apply filters" or a
// click outside the panel (see useFilterPanel below) - never per-checkbox.
function AttributeCheckboxGroups({
  idPrefix,
  attributeGroups,
  selectedTagKeys,
}: {
  idPrefix: string
  attributeGroups: AttributeGroup[]
  selectedTagKeys: string[]
}) {
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
                  <input id={id} type="checkbox" name="tags" value={item.key} defaultChecked={checked} className="peer sr-only" />
                  {/* peer-checked reacts to the checkbox's live DOM state via
                      pure CSS, not a value computed at server-render time -
                      an uncontrolled checkbox's visual toggle would otherwise
                      lag a full page reload behind the actual click. */}
                  <span
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-pill border transition-colors duration-motion ease-motion bg-[var(--bg)] border-[var(--rule)] text-[var(--ink)] peer-checked:bg-[var(--matcha-deep)] peer-checked:border-[var(--matcha-deep)] peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--taro-deep)]"
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

// Drives a <details> used as a batching filter panel (mobile bottom sheet
// or desktop centered modal). Native <details> semantics are the no-JS
// baseline - clicking <summary> opens/closes it with zero script. On top
// of that:
//  - Opening pushes a same-URL history entry, so the physical back button
//    just closes the panel (a "cancel") instead of leaving the page.
//  - Escape and the back button both cancel: the form resets to whatever
//    was actually applied before the panel opened, discarding any
//    unsubmitted checkbox changes, then closes.
//  - Clicking the backdrop (outside the panel content) submits the form
//    as-is - the one "apply by dismissing" path the plan calls for.
//  - The "Apply filters" button is a plain type="submit" with no JS
//    involved at all, so it still works with JS disabled; it just doesn't
//    get the history-cleanup applyAndClose() below gives the other paths.
//  - Closing for any reason other than a real navigation resets the form
//    to its last-applied state, so reopening never shows stale, never-
//    applied checkbox state from a previous cancelled attempt.
function useFilterPanel(formRef: React.RefObject<HTMLFormElement>) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLElement>(null)
  const pushedRef = useRef(false)

  useEffect(() => {
    const details = detailsRef.current
    if (!details) return

    function focusables(): HTMLElement[] {
      if (!panelRef.current) return []
      return Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      )
    }

    function cancelAndClose() {
      formRef.current?.reset()
      details!.open = false
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!details!.open) return
      if (e.key === 'Escape') {
        cancelAndClose()
        if (pushedRef.current) {
          pushedRef.current = false
          history.back()
        }
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
        if (!pushedRef.current) {
          history.pushState({ filterPanelOpen: true }, '')
          pushedRef.current = true
        }
        focusables()[0]?.focus()
      } else {
        // Closed via the summary being clicked again, or programmatically
        // by cancelAndClose()/onPopState below - either way, that's every
        // close path except a real form submission (which navigates away
        // and makes this moot), so resetting here is always correct.
        formRef.current?.reset()
      }
    }

    function onPopState() {
      if (details!.open) {
        // The entry we pushed is already gone (that's what just fired this
        // event) - don't call history.back() again, just reflect the close.
        pushedRef.current = false
        details!.open = false
      }
    }

    details.addEventListener('toggle', onToggle)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('popstate', onPopState)
    return () => {
      details.removeEventListener('toggle', onToggle)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('popstate', onPopState)
    }
  }, [formRef])

  const applyFromBackdrop = () => formRef.current?.requestSubmit()

  return { detailsRef, panelRef, triggerRef, applyFromBackdrop }
}

export default function CityFilterBar(props: CityFilterBarProps) {
  const { citySlug, cityName, resultCount, totalCount, activeChips, clearAllHref, attributeGroups, selectedTagKeys } = props
  const mobileFormRef = useRef<HTMLFormElement>(null)
  const desktopFormRef = useRef<HTMLFormElement>(null)
  const mobile = useFilterPanel(mobileFormRef)
  const desktop = useFilterPanel(desktopFormRef)

  const activeCount = activeChips.length
  const moreFiltersCount = attributeGroups.reduce((sum, g) => sum + g.items.length, 0)

  // Both overlays are full-screen, so lock body scroll while either is open.
  useEffect(() => {
    const detailsEls = [mobile.detailsRef.current, desktop.detailsRef.current].filter(
      (el): el is HTMLDetailsElement => el !== null
    )
    if (detailsEls.length === 0) return
    function updateScrollLock() {
      document.body.style.overflow = detailsEls.some((el) => el.open) ? 'hidden' : ''
    }
    detailsEls.forEach((el) => el.addEventListener('toggle', updateScrollLock))
    return () => {
      detailsEls.forEach((el) => el.removeEventListener('toggle', updateScrollLock))
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

      {/* Desktop: compact bar with a "More filters" button that opens a
          centered modal (not a corner dropdown) for the grouped, per-city
          attribute checkboxes. */}
      <form
        ref={desktopFormRef}
        action={`/find-boba-shops/${citySlug}`}
        method="GET"
        className="hidden md:flex flex-col gap-3 p-4 rounded-card mb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--rule)' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <QuickFields idPrefix="desktop" {...props} autoSubmit />
          {moreFiltersCount > 0 && (
            <details ref={desktop.detailsRef}>
              <summary
                ref={desktop.triggerRef}
                className={`list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-control ${focusRingClass}`}
                style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}
              >
                More filters{selectedTagKeys.length > 0 ? ` (${selectedTagKeys.length})` : ''}
              </summary>
              {/* Centered modal, not anchored to the button - a fixed
                  full-screen backdrop with the panel itself centered via
                  flex. Clicking the backdrop (not the panel) applies. */}
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                style={{ background: 'rgba(30,41,59,0.4)' }}
                onClick={desktop.applyFromBackdrop}
              >
                <div
                  ref={desktop.panelRef}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg rounded-card shadow-lg max-h-[80vh] overflow-y-auto p-6"
                  style={{ background: 'var(--surface)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>
                      More filters
                    </h2>
                    <Link href={clearAllHref} className="text-sm underline" style={{ color: 'var(--ink-muted)' }}>
                      Clear all
                    </Link>
                  </div>
                  <AttributeCheckboxGroups idPrefix="desktop" attributeGroups={attributeGroups} selectedTagKeys={selectedTagKeys} />
                  <button
                    type="submit"
                    className={`mt-5 w-full text-sm font-semibold px-4 py-3 rounded-control text-white ${focusRingClass}`}
                    style={{ background: 'var(--matcha-deep)' }}
                  >
                    Apply filters
                  </button>
                </div>
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
          opens/closes without JS. JS adds the focus trap, Escape/back-
          button cancel, and backdrop-click-applies on top. */}
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
              when closed), so it behaves like a bottom sheet on mobile.
              Clicking the backdrop (not the sheet) applies. */}
          <div
            className="fixed inset-0 z-[60] flex flex-col justify-end"
            style={{ background: 'rgba(30,41,59,0.4)' }}
            onClick={mobile.applyFromBackdrop}
          >
            <form
              ref={(el) => {
                mobileFormRef.current = el
                mobile.panelRef.current = el
              }}
              action={`/find-boba-shops/${citySlug}`}
              method="GET"
              onClick={(e) => e.stopPropagation()}
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
              <AttributeCheckboxGroups idPrefix="mobile" attributeGroups={attributeGroups} selectedTagKeys={selectedTagKeys} />
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
