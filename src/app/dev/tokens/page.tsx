import { Metadata } from 'next'

// Internal design-review page only (docs/UI-OVERHAUL-PLAN-09sep2026.md
// Phase 1). Not linked from anywhere, not in sitemap.ts, noindex'd below.
export const metadata: Metadata = {
  title: 'Design Tokens (internal)',
  robots: {
    index: false,
    follow: false,
  },
}

const COLOR_TOKENS = [
  { name: '--bg', hex: '#FDFBF7', contrast: '—', use: 'Page background' },
  { name: '--surface', hex: '#FFFFFF', contrast: '—', use: 'Cards, sheets, sticky bars' },
  { name: '--ink', hex: '#1E293B', contrast: '14.15:1', use: 'Primary text, shop names' },
  { name: '--ink-muted', hex: '#64748B', contrast: '4.60:1', use: 'Addresses, hours, secondary meta' },
  { name: '--matcha', hex: '#8CB369', contrast: '2.32:1', use: 'Decorative only — fails text contrast' },
  { name: '--matcha-deep', hex: '#4F7A34', contrast: '4.88:1', use: 'Primary buttons, links, active filter state' },
  { name: '--taro', hex: '#9B7EBD', contrast: '3.32:1', use: 'Decorative only — fails text contrast' },
  { name: '--taro-deep', hex: '#7B5CA6', contrast: '5.18:1', use: 'Pearl rating badge, accent text' },
  { name: '--rule', hex: '#E7E2D8', contrast: '1.25:1', use: 'Decorative hairlines only' },
  { name: '--border-control', hex: '#8F8677', contrast: '3.48:1', use: 'Borders on inputs/buttons/focusable controls' },
]

const SPACING_SCALE = [
  { px: 4, tw: 'p-1 / gap-1' },
  { px: 8, tw: 'p-2 / gap-2' },
  { px: 12, tw: 'p-3 / gap-3' },
  { px: 16, tw: 'p-4 / gap-4' },
  { px: 24, tw: 'p-6 / gap-6' },
  { px: 32, tw: 'p-8 / gap-8' },
  { px: 48, tw: 'p-12 / gap-12' },
  { px: 64, tw: 'p-16 / gap-16' },
  { px: 96, tw: 'p-24 / gap-24' },
]

export default function DevTokensPage() {
  return (
    <main style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }} className="py-12">
      <div className="container-custom max-w-5xl space-y-16">
        <header>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Internal — not indexed, not linked</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.15, letterSpacing: '-0.015em' }}>
            Design tokens
          </h1>
          <p className="mt-2" style={{ color: 'var(--ink-muted)' }}>
            docs/design-system.md is the written reference. This page is for visual review only.
          </p>
        </header>

        {/* Color */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', marginBottom: '1rem' }}>Color</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {COLOR_TOKENS.map((t) => (
              <div key={t.name}>
                <div
                  style={{ background: t.hex, border: '1px solid var(--rule)', borderRadius: 'var(--r-media)' }}
                  className="h-20 w-full mb-2"
                />
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{t.hex} · {t.contrast}</p>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{t.use}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Type scale */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', marginBottom: '1rem' }}>Type scale</h2>
          <div className="space-y-4">
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '3rem', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              Display · Gabarito 700 · 3rem
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.15, letterSpacing: '-0.015em' }}>
              H1 · Gabarito 700 · 2.25rem
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              H2 · Gabarito 600 · 1.75rem
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.375rem', lineHeight: 1.3, letterSpacing: '-0.005em' }}>
              H3 · Gabarito 600 · 1.375rem
            </p>
            <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 400, fontSize: '1.0625rem', lineHeight: 1.65, maxWidth: '68ch' }}>
              Body-lg · Inter 400 · 1.0625rem · intro copy, descriptions. This line demonstrates the max-width of 68 characters that body copy blocks are capped at, so a paragraph of real intro copy never stretches into an uncomfortably long line length on wide viewports.
            </p>
            <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 400, fontSize: '1rem', lineHeight: 1.6 }}>
              Body · Inter 400 · 1rem
            </p>
            <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 400, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--ink-muted)' }}>
              Small · Inter 400 · 0.875rem · meta, addresses
            </p>
            <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.4, letterSpacing: '0.005em' }}>
              Label · Inter 600 · 0.8125rem · sentence case, never all-caps
            </p>
          </div>
        </section>

        {/* Spacing */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', marginBottom: '1rem' }}>Spacing</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>
            4px base scale — maps directly onto Tailwind&apos;s default spacing utilities, no custom config needed.
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            {SPACING_SCALE.map((s) => (
              <div key={s.px} className="text-center">
                <div style={{ width: s.px, height: s.px, background: 'var(--matcha-deep)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>{s.px}px<br />{s.tw}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Radius */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', marginBottom: '1rem' }}>Radius</h2>
          <div className="flex gap-6 flex-wrap">
            {[
              { name: '--r-card', value: '14px', cls: 'rounded-card' },
              { name: '--r-media', value: '10px', cls: 'rounded-media' },
              { name: '--r-control', value: '10px', cls: 'rounded-control' },
              { name: '--r-pill', value: '999px', cls: 'rounded-pill' },
            ].map((r) => (
              <div key={r.name} className="text-center">
                <div className={r.cls} style={{ width: 96, height: 64, background: 'var(--surface)', border: '1px solid var(--rule)' }} />
                <p className="text-xs mt-2" style={{ color: 'var(--ink-muted)' }}>{r.name} ({r.value})<br />.{r.cls}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Elevation */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', marginBottom: '1rem' }}>Elevation</h2>
          <div className="flex gap-6 flex-wrap">
            <div className="rounded-card p-6" style={{ background: 'var(--surface)', border: 'var(--e-rest-border)', width: 220 }}>
              <p className="font-semibold text-sm">--e-rest</p>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>1px solid var(--rule), no shadow. Default card state.</p>
            </div>
            <div className="rounded-card shadow-raised p-6" style={{ background: 'var(--surface)', width: 220 }}>
              <p className="font-semibold text-sm">--e-raised</p>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Sticky header on scroll, open dropdowns, mobile filter sheet only.</p>
            </div>
          </div>
        </section>

        {/* Motion */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', marginBottom: '1rem' }}>Motion</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>
            Hover the card below — border shifts to --matcha-deep and the media block scales 1.02, both over 160ms ease-out (duration-motion / ease-motion). No translate, no shadow change. Respects prefers-reduced-motion.
          </p>
          <div
            className="group rounded-card p-4 transition-colors duration-motion ease-motion motion-reduce:transition-none border-[var(--rule)] hover:border-[var(--matcha-deep)]"
            style={{ borderWidth: 1, borderStyle: 'solid', width: 240 }}
          >
            <div
              className="h-24 rounded-media transition-transform duration-motion ease-motion motion-reduce:transition-none group-hover:scale-[1.02]"
              style={{ background: 'var(--taro)' }}
            />
            <p className="text-sm mt-2">Hover me</p>
          </div>
        </section>

        {/* Focus */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', marginBottom: '1rem' }}>Focus states</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>Tab through these — 2px solid var(--taro-deep), 2px offset. Not yet applied as a global default; components adopt it explicitly as they&apos;re rebuilt.</p>
          <div className="flex gap-4 flex-wrap items-center">
            <a
              href="#"
              className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
              style={{ color: 'var(--matcha-deep)' }}
            >
              A focusable link
            </a>
            <button
              className="rounded-control px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
              style={{ background: 'var(--matcha-deep)', minHeight: 44 }}
            >
              A focusable button
            </button>
            <input
              className="rounded-control px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
              style={{ border: '1px solid var(--border-control)', minHeight: 44 }}
              placeholder="A focusable input"
            />
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', marginBottom: '1rem' }}>Buttons</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--ink-muted)' }}>Hover/tab the primary button to see its real rest→hover→focus states, not a simulated swatch.</p>
          <div className="flex gap-4 flex-wrap items-center">
            <button
              className="rounded-control px-4 py-2 text-sm font-semibold text-white transition-colors duration-motion ease-motion hover:brightness-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
              style={{ background: 'var(--matcha-deep)', minHeight: 44 }}
            >
              Primary
            </button>
            <button
              className="rounded-control px-4 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
              style={{ background: 'var(--matcha-deep)', minHeight: 44 }}
              disabled
            >
              Primary (disabled)
            </button>
            <button
              className="rounded-control px-4 py-2 text-sm font-semibold transition-colors duration-motion ease-motion hover:bg-[var(--rule)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
              style={{ border: '1px solid var(--border-control)', color: 'var(--ink)', minHeight: 44 }}
            >
              Secondary / outlined
            </button>
          </div>
        </section>

        {/* Pearl rating badge preview */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', marginBottom: '1rem' }}>Pearl rating badge (signature element)</h2>
          <div
            className="flex items-center justify-center text-white font-semibold rounded-full"
            style={{ background: 'var(--taro-deep)', width: 40, height: 40 }}
            aria-label="Rated 4.6 out of 5 on Google"
          >
            4.6
          </div>
        </section>

        {/* Prose */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem', marginBottom: '1rem' }}>Long-form prose (.prose scope)</h2>
          <article className="prose">
            <p>
              Boba tea, also called bubble tea, began in Taiwan in the 1980s as a simple experiment: what happens when you drop chewy tapioca pearls into a cold, shaken milk tea? The answer turned into one of the most exported drink concepts of the last forty years, and it&apos;s worth understanding both where it came from and why it took over so completely, city by city, cup by cup.
            </p>
            <h2>Where the pearls actually come from</h2>
            <p>
              Tapioca starch is extracted from the cassava root, a starchy tuber originally native to South America but grown widely across Southeast Asia today. The starch is rolled into small spheres, boiled until translucent and chewy, then usually soaked in a simple syrup so they carry their own sweetness independent of the tea around them. Get the timing wrong in either direction — underboiled or left too long — and the texture is the first thing a regular customer will notice.
            </p>
            <ul>
              <li>Black tea base, the most traditional starting point</li>
              <li>Green tea or oolong, for a lighter, more floral cup</li>
              <li>Fruit tea, unsweetened tea shaken with fresh or purateed fruit</li>
              <li>Milk-forward bases with little or no tea at all</li>
            </ul>
            <h3>Why the shop matters as much as the recipe</h3>
            <p>
              Two shops using an identical tea supplier can produce noticeably different drinks, because so much of the result comes down to brew time, ice ratio, and how fresh that day&apos;s batch of pearls actually is. This is part of why a directory like this one leans on real, current signals — a rating, a review count, a &quot;checked today&quot; hours listing — rather than static marketing copy that a shop wrote about itself once and never revisited.
            </p>
            <blockquote>
              &quot;The pearls should still have a little resistance left when you bite down. If they&apos;ve gone soft all the way through, they sat too long.&quot;
            </blockquote>
            <p>
              That distinction — <a href="#">chewy versus soft</a> — is one of the more reliable ways regulars judge a shop&apos;s consistency from visit to visit, more so than any single flavor on the menu.
            </p>
            <figure>
              <img src="/images/boba-cat.jpeg" alt="A cup of bubble tea with tapioca pearls settled at the bottom" />
              <figcaption>A finished cup, pearls settled at the bottom the way they&apos;re meant to be scooped up with a wide straw.</figcaption>
            </figure>
            <h3>What to actually look for</h3>
            <ol>
              <li>A pearl that still has a little bite left in the center</li>
              <li>Tea that tastes like tea underneath the sweetness, not just syrup</li>
              <li>Ice that hasn&apos;t watered the drink down by the time you finish it</li>
            </ol>
            <p>
              None of that requires a rare or expensive shop — it requires a shop that&apos;s making pearls fresh and paying attention, which is exactly the kind of thing a real review count and a recently-checked rating can help surface before you drive across town for a cup that&apos;s been sitting since morning.
            </p>
          </article>
        </section>
      </div>
    </main>
  )
}
