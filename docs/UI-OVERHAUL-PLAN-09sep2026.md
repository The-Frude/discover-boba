# DiscoverBoba.com — UI Overhaul Plan

**Status:** ready for execution
**Audience:** Claude Code (VS Code), working in `github.com/The-Frude/discover-boba`
**How to use this file:** commit it to the repo at `docs/UI-OVERHAUL-PLAN.md`. Work one phase at a time. Each phase has a kickoff prompt, a definition of done, and a verification gate that must pass before the next phase starts.

---

## 0. Read this before writing any code

This site is not a greenfield project. It is a live directory with roughly **813 shop pages across 7 cities** that has recently had a full SEO/GEO pass: JSON-LD structured data, canonical tags, `metadataBase`, authored meta titles and descriptions on every shop, city intro copy, `llms.txt`, and AI-crawler allowances in `robots.ts`. Organic traffic is growing.

**That earned equity is the thing most at risk in a visual redesign.** A redesign that looks better and drops the site's rankings is a net loss. Every phase below is written so that the rendering contract with crawlers stays intact while the presentation layer changes.

### Non-negotiable guardrails

Copy these into `CLAUDE.md` so they persist across sessions.

1. **Do not remove or restructure JSON-LD.** Schema blocks (`LocalBusiness`/`CafeOrCoffeeShop`, `BreadcrumbList`, `FAQPage`, `ItemList`) stay on the same pages, with the same properties. If a component that emits schema is refactored, the emitted JSON must be byte-comparable except for whitespace.
2. **Do not change any `generateMetadata` / `metadata` export**, canonical URL, `metadataBase`, or Open Graph field values. Titles and descriptions were individually authored; they are content, not boilerplate.
3. **Do not change URL structure or route segments.** `/find-boba-shops/[city]` and all shop routes keep their exact paths. No new redirects.
4. **Do not convert server-rendered content to client-rendered content.** Shop names, addresses, descriptions, ratings, hours, and city copy must remain in the initial HTML payload. Interactive layers (map, filters) are progressive enhancements on top of already-rendered content.
5. **Preserve the heading outline.** One `h1` per page, and the existing `h2`/`h3` hierarchy of shop names and section headings stays semantically equivalent. Visual size changes are fine; demoting a shop name from `h2` to a `div` is not.
6. **Preserve every existing internal link.** Crawl paths between homepage → city → shop are load-bearing. Links may be restyled; they may not be removed, replaced with `onClick` handlers, or hidden behind interaction on any breakpoint.
7. **Do not touch `robots.ts`, `sitemap.ts`, `llms.txt`, or the Places API refresh scripts** in this workstream.
8. **No new heavy client dependencies without asking.** No component library (MUI, Chakra, Mantine), no animation library, no CSS-in-JS runtime. Tailwind + a small number of headless primitives only.
9. **Branch per phase.** `ui/phase-N-<name>`, deployed to a Vercel preview, verified, then merged. Never commit directly to `main` in this workstream.

### Anti-generic guardrails

The goal is a site that looks designed for boba, not a site that looks AI-generated. Avoid these specific patterns, all of which read as templated:

- Identical border-radius on every element regardless of hierarchy.
- The same soft grey `rgba(0,0,0,0.1)` shadow under every card.
- Hover-lift on every card plus fade-and-slide-up on every section.
- Tracked-out ALL-CAPS eyebrow labels above headings.
- Meta strings joined with middle dots (`Open · $$ · 4.6`).
- A `→` appended to button and link text.
- Gradient washes used as decoration in more than one place.

Spend boldness in exactly two places (defined in Phase 1): the **pearl rating badge** and the **hero**. Everything else stays quiet and disciplined.

### Decisions already made — do not revisit

- **No new map work in this cycle.** Do not build a split-screen map on city pages, and do not add maps anywhere they don't already exist. The added Maps API cost and INP burden aren't justified right now. Existing map usage stays exactly as it is.
- **No save/bookmark feature.** It requires auth or local storage plus a UX for a logged-out majority, and adds surface area without adding traffic.
- **No "verified" badges.** Nothing on the site is actually verified, and a badge with no verification behind it is trust theater. Real provenance replaces it: "Rating and hours from Google, last checked [date]."

### Open decisions — confirm before Phase 1

- **Photos.** Does the database actually contain shop photo URLs that are legal to display and host? Google Places photo URIs are short-lived and Places content is subject to storage restrictions, so a design that requires a photo on every one of 813 cards is a liability. Phase 0 answers what exists; the design assumes photos are **optional** either way. → _answer (2026-09-09): confirmed — design must not require a photo on every card. Owner will likely source and add photos for shops currently missing one over time, but Phase 2's placeholder tile is not a stopgap to be removed later, it's a permanent part of the design for whatever fraction of shops never gets a real photo._
- **Blog URL structure.** Articles are coming soon (see §10). The path prefix is very expensive to change once articles are indexed, so pick it now even though nothing gets built this cycle: `/blog/[slug]`, `/guides/[slug]`, or city-scoped `/find-boba-shops/[city]/guides/[slug]`. Recommendation: a flat `/guides/[slug]` — it reads as editorial authority rather than a news feed, and keeps articles free to link across cities. → _answer (2026-09-09): confirmed — `/guides/[slug]`._

---

## 1. Phase 0 — Grounded audit (no code changes)

Everything downstream depends on knowing what data and components actually exist. The previous planning pass assumed filters like "Dairy-Free Options," "Drive-Thru," and "Distance" without checking whether those fields exist in Supabase. **Filters that aren't backed by real, well-populated columns must not be built.**

### Kickoff prompt

> Read `docs/UI-OVERHAUL-PLAN.md` in full, then perform the Phase 0 audit only. Make no code changes. Produce `docs/AUDIT.md` containing the sections listed under Phase 0. Where you're unsure, say so explicitly rather than guessing.

### Required output — `docs/AUDIT.md`

**A. Component and route inventory**
- Every route in `app/`, with: server or client component, rendering strategy (static / ISR / dynamic), and `revalidate` value.
- Every component that renders a shop, a city, or a list, with file path and current props.
- Which components carry `'use client'` and why.
- Where JSON-LD is emitted, per page type.
- Current styling approach: Tailwind (which major version — v3 `tailwind.config` vs v4 `@theme`), plain CSS, CSS modules, or a mix. Note any existing design tokens.
- **Content infrastructure that already exists**, since articles are coming next (§10): any MDX/Contentlayer setup, any markdown rendering, any `posts`/`articles` table in Supabase, any `@tailwindcss/typography` install, and how the existing long-form copy (city intros, FAQ answers) is currently stored and rendered. Report what's there; build nothing.

**B. Data inventory (query Supabase directly via `DATABASE_URL`)**

For the shops table, output a table of every column with: type, non-null count, percentage populated, and 3 example values. Explicitly report population counts for:
- photo/image URL fields
- rating, review count, price level
- hours (and its shape — JSON, text, structured?)
- category / tags / attributes of any kind
- lat/lng
- menu URL, website, phone, social handles
- neighborhood or sub-area
- description fields (note: ~271 shops have enriched descriptions, ~542 do not — confirm)

Then answer directly: **which filter and sort dimensions are supported by data populated on at least 60% of shops in every city?** That list, and only that list, is what Phase 5 builds. Report the per-city percentage for each candidate dimension, not just the site-wide average — a field that's 90% populated in Atlanta and 20% in Dallas fails.

**C. Performance and rendering baseline**

Capture before-numbers so regressions are provable:
- Lighthouse (mobile, throttled) for: homepage, `/find-boba-shops/atlanta`, one shop detail page. Record LCP, CLS, INP, TBT, total JS transferred, and the performance score.
- `curl -s <url> | wc -c` and a check that shop names appear in raw HTML for each of the three pages.
- Current font loading strategy and any CLS attributable to it.
- Save all of this in `AUDIT.md` under a "Baseline" heading.

**D. Caching posture**

`/find-boba-shops/[city]` has served stale or inconsistent content on three separate occasions, including the same URL serving different cached snapshots concurrently. Document, precisely:
- The current caching configuration for that route (`revalidate`, `dynamic`, `fetch` cache options, `unstable_cache` usage, Supabase client caching).
- Whether query strings produce separate cache entries.
- Where a `revalidatePath`/`revalidateTag` call would need to live to purge it.

Propose a single explicit caching strategy for the route and state the tradeoff. Do not implement it yet — but Phase 6 will touch this route, and it must land with caching made deliberate rather than inherited.

**E. Prioritized findings**

A ranked list of UI/UX problems found, each tagged `[visual]`, `[structural]`, `[a11y]`, `[perf]`, or `[data]`, with the file(s) involved. Rank by user impact, not by ease.

### Gate

Owner reviews `AUDIT.md`. The filter list in section B and the caching proposal in section D are approved or amended in writing. Phase 1 does not start until then.

---

## 2. Phase 1 — Design system

Design decisions are made here, once, and referenced everywhere. No component work in this phase.

### Palette

Colors below are contrast-tested against the page background `#FDFBF7`. **The mid-tone matcha and taro are decorative only** — they fail WCAG AA for text and must never carry text or be the sole signal for meaning. This is the correction to the original palette proposal, where `#8CB369` on off-white measured 2.32:1 against a 4.5:1 requirement.

| Token | Hex | Contrast on `#FDFBF7` | Use |
|---|---|---|---|
| `--bg` | `#FDFBF7` | — | Page background (warm, not hospital white) |
| `--surface` | `#FFFFFF` | — | Cards, sheets, sticky bars |
| `--ink` | `#1E293B` | 14.15:1 | Primary text, shop names |
| `--ink-muted` | `#64748B` | 4.60:1 | Addresses, hours, secondary meta |
| `--matcha` | `#8CB369` | 2.32:1 | **Decorative only** — fills, illustration, open-status dot |
| `--matcha-deep` | `#4F7A34` | 4.88:1 (white on it: 5.04:1) | Primary buttons, links, active filter state |
| `--taro` | `#9B7EBD` | 3.32:1 | **Decorative only** — gradient art, hover wash |
| `--taro-deep` | `#7B5CA6` | 5.18:1 (white on it: 5.35:1) | Pearl rating badge, accent text |
| `--rule` | `#E7E2D8` | 1.25:1 | Decorative hairlines only |
| `--border-control` | `#8F8677` | 3.48:1 | Borders on inputs, buttons, focusable controls (meets the 3:1 non-text requirement) |

Rules: matcha is the action color, taro is the rating/accent color, and they never compete in the same element. No third accent. No gradient outside the hero and the placeholder art system.

### Typography

Load via `next/font/google` with `display: 'swap'` and preloaded subsets — this is also a CLS fix.

- **Headings — `Gabarito`.** Friendly geometric with enough idiosyncrasy to have a personality; the register Poppins is usually reaching for, without being the most-used AI-default face on the web. Weights 600/700 only.
- **Body and UI — `Inter`.** Legibility at small sizes for addresses, hours, and filter labels. Weights 400/500/600.

If `Gabarito` isn't available in `next/font/google` in the installed version, fall back to `Familjen Grotesk`, then `Schibsted Grotesk`. Report which one you used. Do not substitute Poppins.

Type scale (desktop; scale down one step below `768px`):

```
display   3rem     / 1.05  / -0.02em   Gabarito 700   hero only
h1        2.25rem  / 1.15  / -0.015em  Gabarito 700
h2        1.75rem  / 1.2   / -0.01em   Gabarito 600
h3        1.375rem / 1.3   / -0.005em  Gabarito 600
body-lg   1.0625rem/ 1.65                Inter 400     intro copy, descriptions
body      1rem     / 1.6                 Inter 400
small     0.875rem / 1.5                 Inter 400     meta, addresses
label     0.8125rem/ 1.4   / 0.005em     Inter 600     filter labels, badges (sentence case, never all-caps)
```

Body copy blocks max out at `68ch`.

**Long-form prose styles.** Define these now even though nothing uses them yet — articles are coming (§10), and retrofitting article typography after the fact is how a site ends up with two visual languages. Add a single `.prose` scope (or configure `@tailwindcss/typography` against the tokens if it's already installed) covering: paragraph rhythm at `body-lg`, `h2`/`h3` within prose, unordered and ordered lists, blockquote, inline links underlined in `--matcha-deep`, `figure`/`figcaption`, and a full-width image treatment at `--r-media`. Demonstrate it on `/dev/tokens` with a ~400-word sample containing every one of those elements.

### Space, radius, elevation

- Spacing: 4px base — `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`.
- Radius, varied deliberately by role: `--r-card: 14px`, `--r-media: 10px`, `--r-control: 10px`, `--r-pill: 999px`. Do not apply one radius to everything.
- Elevation, two levels only:
  - `--e-rest`: `1px solid var(--rule)` and no shadow. Cards sit on the page, they don't float.
  - `--e-raised`: `0 6px 24px -8px rgba(30,41,59,0.18)` — sticky header on scroll, open dropdowns, mobile filter sheet. Nothing else.

### Motion

- One orchestrated page-load moment total, on the homepage hero only.
- Card interaction: border color shifts to `--matcha-deep` and the media element scales `1.02`. No translate, no shadow change.
- All transitions `160ms` `ease-out`. Everything wrapped in `@media (prefers-reduced-motion: reduce)` with motion removed.

### Focus and accessibility floor

- Visible focus ring on every interactive element: `2px solid var(--taro-deep)` with `2px` offset. Never `outline: none` without a replacement.
- Hit targets ≥ 44×44px on touch.
- Every icon-only control gets an `aria-label`.
- Status is never color-only: "Open now" is a dot **plus** the words.

### Implementation

Define all of the above as CSS custom properties in `app/globals.css`, then map them into Tailwind (v4: an `@theme` block; v3: `tailwind.config.ts` `theme.extend`). Components consume Tailwind utilities that resolve to the tokens — no raw hex values in component files, ever.

### Kickoff prompt

> Implement Phase 1 from `docs/UI-OVERHAUL-PLAN.md` on branch `ui/phase-1-tokens`. Define the tokens, wire the fonts through `next/font/google`, and map everything into the existing Tailwind setup detected in the audit. Change no component markup. Then create `docs/design-system.md` showing each token with its value and intended use, and add a `/dev/tokens` page (excluded from the sitemap and `noindex`) that renders every token, type step, button state, and focus state for visual review.

### Definition of done

Tokens exist and are consumed by nothing yet. `/dev/tokens` renders. Zero visual change to any public page. Zero change to Lighthouse scores except any CLS improvement from font loading.

---

## 3. Phase 2 — The placeholder art system

**Do this before any card work.** It's the answer to the hardest constraint on the project: several hundred shops have no photo, and a directory where most cards are grey boxes looks worse than one with no photos at all.

Build a deterministic generated tile, rendered as inline SVG or CSS gradient, seeded by the shop's stable ID:

- A layered vertical composition that reads as a cup of boba: a milk-tea band, a tea band, and a cluster of pearls settling at the bottom.
- The seed picks one of **six** palettes drawn from real drink colors — matcha, taro, brown sugar, thai tea, strawberry, jasmine — so a city grid looks varied but coherent, and the same shop always gets the same tile.
- Pure CSS/SVG, no images, no network requests, negligible payload.
- Where a real photo exists, it takes precedence and the tile is the fallback.

This is one of the two places the design spends boldness. It should be genuinely nice to look at.

### Kickoff prompt

> Implement Phase 2 on branch `ui/phase-2-placeholder`. Build a `ShopTile` component per `docs/UI-OVERHAUL-PLAN.md` §3. It takes a shop ID and an optional image URL, renders the real image when present and a deterministic generated tile otherwise. Add it to `/dev/tokens` showing 12 different seeds in a grid so I can review the variety. Don't wire it into production pages yet.

### Definition of done

12 seeds render visibly distinct, on-brand tiles. Same seed always produces the same tile. No layout shift — the tile has an intrinsic aspect ratio (4:3).

---

## 4. Phase 3 — The shop card

The single most-repeated component on the site. Get it right and 90% of the visual upgrade is done.

### Anatomy

```
┌──────────────────────────────┐
│  [ media 4:3 — photo/tile ]  │
│                        (4.6) │  ← pearl badge, overlapping bottom-right of media
├──────────────────────────────┤
│  Shop Name              h2/h3│
│  1234 Peachtree Rd NE   small│
│  ● Open now · closes 9 PM    │
│  [ pill ] [ pill ]           │
└──────────────────────────────┘
```

- **Media:** fixed 4:3, `--r-media`, `object-fit: cover`. Never lets the grid jump.
- **The pearl badge:** a filled circle in `--taro-deep`, white numeral, overlapping the bottom-right corner of the media. This is the site's signature element — a tapioca pearl doing a job. One decimal, no "/5" (the label is `aria-label`'d as "Rated 4.6 out of 5 on Google"). Shops with no rating get **no badge** — never a grey "N/A" circle.
- **Name:** `h3` inside city-page grids (under the section `h2`), wrapped in the link to the shop page. Whole card is clickable via a stretched-link pattern, but the anchor wraps the name so link text is meaningful to crawlers and screen readers.
- **Meta line:** address, then open status if hours data exists. Separated by a thin space and a small dot glyph only where genuinely needed — do not build a middle-dot meta string.
- **Pills:** maximum two, drawn only from attributes confirmed populated in Phase 0. If a shop has none, the row disappears — no empty scaffolding.
- **Rest state:** `--e-rest`. **Hover/focus:** border → `--matcha-deep`, media scales 1.02. Nothing else.

### Grid

`repeat(auto-fill, minmax(280px, 1fr))`, gap `24px`. One column below `640px`, and at that width the card switches to a horizontal layout (96px square media on the left, text on the right) so mobile users see 4–5 shops per screen instead of 1.5. This is the highest-impact mobile change on the site.

### Kickoff prompt

> Implement Phase 3 on branch `ui/phase-3-card`. Rebuild the shop card per `docs/UI-OVERHAUL-PLAN.md` §4, using the Phase 1 tokens and the Phase 2 `ShopTile`. Keep the component a server component. Preserve the existing heading level, the existing link href, and any schema markup the current card emits — diff the emitted JSON-LD before and after and show me it's unchanged. Render the new card on `/dev/tokens` with 6 real shops pulled from Supabase, including at least one with no rating, one with no description, and one with a very long name. Then build the `ArticleCard` sibling described in §10 — same media treatment and grid, no pearl badge — and preview it with three placeholder items. It is not wired into any page.

### Definition of done

Long shop names wrap without breaking layout. Missing rating, missing photo, and missing attributes all degrade gracefully. Keyboard tab reaches the card link and the focus ring is clearly visible. JSON-LD diff is clean.

---

## 5. Phase 4 — Global shell

- **Header:** sticky, `72px` desktop / `56px` mobile, `--surface` with a `--rule` bottom border. Wordmark left. Persistent search input that stays visible on scroll — for a directory, search is the product, and hiding it behind an icon on mobile is the wrong trade. On mobile the search collapses to a full-width row beneath the wordmark rather than into an icon.
- **Search behavior:** the input posts to a real URL. It must work with JavaScript disabled. Typeahead is an enhancement layered on top; if typeahead ships, results are keyboard navigable (`aria-activedescendant`, arrow keys, Escape to close).
- **Footer:** the most under-used SEO asset on most directories. Structure it as real, crawlable link groups: all 7 cities, popular searches, About, Contact, and the site's provenance statement ("Listings sourced from Google Places, refreshed monthly"). Not a row of social icons. Build the group structure so a **Guides** column can be added by passing one more array — don't render an empty column now.
- **Breadcrumbs:** visible on city and shop pages, matching the existing `BreadcrumbList` schema exactly.

### Kickoff prompt

> Implement Phase 4 on branch `ui/phase-4-shell`. Rebuild header, footer, and breadcrumbs per §5. Every currently-existing internal link must still exist — before you start, dump the set of hrefs rendered by the current header and footer, and after you finish, diff it and show me the result. Search must work with JS disabled.

---

## 6. Phase 5 — Filters and sort

**Amended 2026-09-09, per owner direction:** filters are decided **per city**, not as one global list. If a dimension clears the ≥60%-populated bar in a given city, that city's page gets that filter — it is fine and expected for different cities to offer different filter sets. The goal is a site that genuinely helps people find a shop, not visual consistency of the filter bar across cities.

**Per-city dimension table (from `docs/AUDIT.md`, recomputed per-city rather than by cross-city minimum):**

| Dimension | Atlanta | Chicago | Dallas | New York | Philadelphia | Seattle | Washington |
|---|---|---|---|---|---|---|---|
| Rating (sort + min-rating) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review count (sort) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Open now (hours) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delivery | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Wheelchair accessible | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Social media presence | ✅ (75%) | ✅ (68%) | ✅ (77%) | ✅ (70%) | ✅ (71%) | ✅ (63%) | ❌ (54%) |

Rating/reviews/hours/Delivery/Wheelchair-accessible clear 60% in all 7 cities individually (this didn't change from the original cross-city analysis — those five were never close to the line). **Social media presence is the one dimension the per-city approach actually rescues**: it fails the original "minimum across all 7 cities" test only because Washington sits at 54%, but the other six cities clear 60% (63–77%). Ship it everywhere except Washington. Sub-splitting "Wheelchair accessible" into entrance/parking-lot/restroom variants was considered and rejected — the single existing tag already clears 60% everywhere, and fragmenting it into near-duplicate filters adds complexity without adding real capability. LGBTQ+-friendly and ownership-identity attributes (women-owned, etc.) were re-checked per-city too and don't clear 60% in *any* single city (highest is Chicago at 54% for LGBTQ+-friendly) — still not viable as filters anywhere, though real and worth a per-card badge if a later phase wants one.

**In-page search, combined with filters (added 2026-09-09):** a city page needs a text search box that narrows the *currently filtered* result set further — a user should be able to apply "Wheelchair accessible" and then type "milk tea" and get the intersection, not one or the other. Implement as another URL param (e.g. `?q=`) applied server-side alongside tags/sort/minRating/open, matching a shop's `name` (and consider `tags`/`about` keywords if a simple `ILIKE`-style match proves too narrow in testing) — not a client-side-only filter, so it stays server-resolved per Phase 6's rendering rules and degrades correctly with JS disabled, same as the header search in Phase 4. Empty-state copy must account for the combination ("No shops match 'milk tea' with Wheelchair accessible in Seattle. Clear filters to see all 142 shops.").

- **State lives in the URL** as query params (`?sort=rating&open=now&q=...`). This keeps filtered views shareable, keeps the server the source of truth, and avoids a client-side data layer.
- **Canonical URLs on filtered views point at the unfiltered city URL.** Non-negotiable — filter combinations must not create indexable near-duplicates of pages that currently rank.
- **Desktop:** a horizontal bar above the grid, search box included in that bar. Active filters use `--matcha-deep` fill with white text. Applying a filter or search updates the result count in a live region.
- **Mobile:** a bottom sheet, opened by a single "Filters" button showing the active count. Sheet has Apply and Clear all. Focus is trapped while open, Escape closes, focus returns to the trigger. The search box itself stays visible outside the sheet (it's the primary tool, not a secondary filter).
- **Empty state:** never a bare "No results." Name what was filtered/searched, offer the single most useful escape hatch ("No shops match these filters in Atlanta. Clear filters to see all 96 shops."), and keep the escape hatch as a real link.

---

## 7. Phase 6 — City pages

The highest-traffic template, the most fragile route, and the one that has served stale content three times. Handle with care.

### Layout

**Amended 2026-09-09, per owner direction: keep the map, don't remove it.** The original plan below called for dropping the map entirely. Owner decision: it can stay as long as it's unobtrusive, stays near the bottom of the page, and stays lazy-loaded so it doesn't add API cost or weight to the initial render. That's already exactly how it behaves today (`CityMapView` lazy-inits on `IntersectionObserver` with a 300px root margin, and it's already the last section on the page, after the listings) - so this phase keeps that section, just restyles its container to match the new tokens (quiet, not a splashy full-bleed section) rather than deleting it. The reasoning below about split-screen maps still holds and is why this stays a single below-the-fold section, not a split-screen layout next to the grid.

Single-column, full-width shop grid at every breakpoint, centered in a `1200px` container. City intro copy above the grid, FAQ below it (if present), both keeping their current position in the DOM, map section last.

A split-screen map would multiply Maps API loads across the highest-traffic template, add a client bundle and an INP cost to the pages that rank, and buy less than it costs at this stage. The full grid width also means more shops visible per screen, which is the actual job of a city page.

Below the map, reserve a **related reading** slot (see §10) that renders nothing until articles exist.

### Rendering rules — read twice

- **The shop list renders on the server**, in the initial HTML, with no client-side data fetching for listings.
- **This phase adds no new client components beyond what already exists.** `CityMapView`, `JumpToMapButton`, and `CityFilterBar` (Phase 5) already exist and stay; nothing new is introduced on top of them.
- **Existing city intro copy, FAQ blocks, and JSON-LD stay exactly where they are** in the DOM order relative to the listings.

### Caching

This phase lands the caching strategy approved in the Phase 0 gate. State the chosen `revalidate` value and rendering mode explicitly in the route file with a comment explaining why. After deploying, verify with five consecutive `curl -sI` requests to the same URL and confirm `x-vercel-cache` and `age` headers behave consistently, then five requests checking that a known-changed value (e.g. a shop's rating) is identical across all five responses.

### Kickoff prompt

> Implement Phase 6 on branch `ui/phase-6-city`. Rebuild `/find-boba-shops/[city]` per §7. Before touching anything, save the raw HTML of the current Atlanta page to a file. After your changes, diff the two for: shop names present, count of internal links, heading outline, and JSON-LD blocks. Show me that diff. Keep the existing map section (restyled, still lazy-loaded, still last on the page) - don't remove it, and don't add any new client component beyond what already exists. Land the caching strategy approved in the Phase 0 gate, with a comment in the route file explaining the choice.

### Gate — verify against production, not against your own report

Past experience on this exact route: code and database were correct and production still served stale, inconsistent content. So after the preview passes:

1. Deploy, then hard-refresh the live URL in a browser.
2. Run 5 `curl` requests against the live URL and confirm the rendered shop count and a sample rating are identical in all 5.
3. Check both the bare URL and a paginated/filtered variant.
4. View source and confirm shop names are in the raw HTML.
5. Run Lighthouse mobile and compare to the Phase 0 baseline. LCP must not regress by more than 200ms; CLS must not increase; total JS must not increase by more than 40KB.

---

## 8. Phase 7 — Shop detail pages

813 pages, and the ones most likely to be an AI assistant's or a searcher's landing page. They need to answer "should I go here, and how" above the fold.

- **Header block:** shop name (`h1`), pearl rating badge with review count, neighborhood/city, and a status line. No hero image unless a real photo exists — a full-bleed generated tile at hero scale would look like a placeholder, which is the opposite of the goal.
- **Action row, directly beneath:** Directions, Call, Website, Menu. Only render buttons for data that exists. Primary button in `--matcha-deep`; the rest are outlined with `--border-control`.
- **The facts panel:** hours (today's highlighted, full week expandable), address, price level, phone. Structured as a description list. This is what people actually came for — it goes above the prose, not below it.
- **Description:** the enriched copy where it exists (271 shops). Where it doesn't, do not render an empty section or filler text — restructure so the facts panel carries the page.
- **Provenance line:** "Rating and hours from Google, last checked [date]." Real trust beats a badge.
- **Nearby shops:** 3–6 cards from the same city, plus a link back to the city page. Crawlable internal links, and genuinely useful to a reader who's deciding.
- **Related reading slot:** reserved below nearby shops, renders nothing until articles exist (§10).

---

## 9. Phase 8 — Homepage

- **Hero:** the second place boldness is spent. A layered gradient drawn from the same six drink palettes as the tile system, a `display`-size headline stating what the site is and its scale ("Find the best boba in 7 cities. 800+ shops, checked and rated."), and a large search input as the primary action. The scale claim is the trust signal — use the real number.
- **City section:** replace the text list with city cards, each showing the city name, shop count, and a generated tile in that city's assigned palette. Links keep their existing hrefs.
- **"What is boba tea?" FAQ:** convert to accordions. **The answer text must remain in the DOM when collapsed** (CSS-hidden, not conditionally rendered) so it stays in the HTML payload for search and AI crawlers, and so the `FAQPage` schema stays truthful. Use `<details>`/`<summary>` unless a specific requirement rules it out.
- **Reserved article slot** between the city section and the FAQ: a section that renders a heading plus a 3-card row when articles are passed to it, and renders nothing at all when the array is empty (§10). Ship it empty.
- No testimonial section, no fake stat counters, no logo wall.

---

## 10. Groundwork for articles (build the hooks, not the feature)

Blog articles are coming shortly after this overhaul, featured on the homepage and city pages to add content and internal linking. **Do not build the blog in this workstream.** No CMS, no MDX pipeline, no routes, no schema, no article pages.

What does belong here is the small set of things that are cheap to include now and expensive to retrofit — the difference between articles slotting into a finished design and articles arriving as a visually separate section bolted onto the side.

Included in the phases above:

1. **Prose typography** — defined in Phase 1, demonstrated on `/dev/tokens`. Articles inherit the site's type system instead of getting their own.
2. **Reserved slots** that render nothing when empty — homepage between cities and FAQ (Phase 8), city page below the FAQ (Phase 6), shop page below nearby shops (Phase 7). Each takes an array of `{ title, slug, excerpt, city? }` and returns `null` on an empty array. Ship them empty.
3. **An `ArticleCard` component** built in Phase 3 alongside the shop card, sharing its media treatment, tokens, and grid — but with its own anatomy (title, excerpt, read time) and **no pearl badge**. Preview it on `/dev/tokens` with placeholder data. It should look like a sibling of the shop card, not a cousin.
4. **Footer link-group structure** that accepts a Guides column without restructuring (Phase 4).
5. **A URL prefix decision**, made before Phase 1 (see Open decisions). Nothing gets built against it; it just needs to be settled before anything is published.

Keep in mind for later, out of scope now: `BlogPosting`/`Article` JSON-LD, an author entity, article breadcrumbs, an index page with pagination, `llms.txt` updates, and sitemap entries. The internal-linking strategy — city pages linking to city guides, guides linking back to specific shop pages — is the highest-value part and deserves its own planning pass once the design is stable.

## 11. Phase 9 — States, polish, and accessibility pass

- **Loading:** skeletons that match the real card's dimensions exactly, so nothing shifts. Skeletons only where content genuinely streams in — a static server-rendered grid does not get a skeleton.
- **Empty:** every empty state names what's missing and offers one clear action.
- **Error:** plain language, states what happened, offers a way forward. No apology, no exclamation marks.
- **404:** a real search input and links to all 7 cities.
- **Full a11y sweep:** keyboard-only pass of every page type; axe DevTools with zero critical issues; heading outline check; every image has meaningful `alt` or `alt=""` if decorative; `prefers-reduced-motion` honored everywhere.
- **Final performance pass:** compare all three page types against the Phase 0 baseline and record the table in `docs/AUDIT.md`.

---

## 12. Verification protocol (every phase)

Before merging any phase branch:

1. `npm run build` succeeds with no new warnings.
2. Preview deploy inspected on a real phone, not just a narrow desktop window.
3. Keyboard-only navigation of the changed pages.
4. `curl` the changed pages and confirm content is in the raw HTML.
5. JSON-LD diff clean (Rich Results Test on one page of each changed type).
6. Lighthouse mobile compared to the Phase 0 baseline.
7. **Independent check of the live site after merge** — not just the agent's completion report. This site has a documented history of code being correct while production served something else.

## 13. Rollback

Each phase is one branch and one squashed merge commit. Rolling back is `git revert <merge-sha>` plus a redeploy. Do not batch multiple phases into one merge — that's what makes a bad phase unrecoverable.

## 14. Suggested sequence

Phases 0 → 1 → 2 → 3 are the critical path; the card carries most of the perceived quality improvement and should reach production early. Phases 4 and 8 are quick wins after that. Phase 6 (city pages) is now much lighter without the map, but it's still the highest-traffic template and the one with the caching history, so it shouldn't be attempted until the card and tokens are stable in production. Phase 5 depends entirely on what Phase 0 finds in the data, and may end up being very small.

If the work has to stop early, stopping after Phase 4 still leaves the site meaningfully transformed. Articles can begin as soon as Phase 8 is merged — the slots and prose styles will be waiting.
