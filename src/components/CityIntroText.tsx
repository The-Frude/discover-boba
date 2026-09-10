// CSS-only expand/collapse (a checkbox + peer-checked, same pattern used
// for the filter pills in CityFilterBar) - the full text is always in the
// server-rendered HTML for SEO/AI crawlers; toggling only changes what's
// visually clamped, never what's in the DOM. No JS required.
export default function CityIntroText({ citySlug, text }: { citySlug: string; text: string }) {
  const id = `city-intro-expand-${citySlug}`

  return (
    <div className="mb-10">
      <input type="checkbox" id={id} className="peer sr-only" />
      <p className="leading-relaxed line-clamp-3 peer-checked:line-clamp-none" style={{ color: 'var(--ink-muted)' }}>
        {text}
      </p>
      <label
        htmlFor={id}
        className="inline-block peer-checked:hidden mt-2 text-sm font-semibold cursor-pointer underline"
        style={{ color: 'var(--matcha-deep)' }}
      >
        Read more
      </label>
      <label
        htmlFor={id}
        className="hidden peer-checked:inline-block mt-2 text-sm font-semibold cursor-pointer underline"
        style={{ color: 'var(--matcha-deep)' }}
      >
        Show less
      </label>
    </div>
  )
}
