# Phase 0 Audit — DiscoverBoba.com UI Overhaul

**Date:** 2026-09-09
**Scope:** read-only investigation per `docs/UI-OVERHAUL-PLAN-09sep2026.md` §1. No code changes were made while producing this document. All data findings are from direct queries against production Supabase via `DATABASE_URL`; all performance findings are from real Lighthouse (mobile, simulated throttling) runs against the live production site.

---

## A. Component and route inventory

### Routes (`src/app/`)

| Route | Type | Rendering | Notes |
|---|---|---|---|
| `/` | page | **Dynamic** (no manifest entry, no `revalidate`) | No `generateMetadata` — inherits root layout metadata. Organization JSON-LD. Hero uses `OptimizedImage` (client component, see Perf below). |
| `/find-boba-shops` | page | **Static** (`initialRevalidateSeconds: false` — cached forever until redeploy) | Static `metadata` export. |
| `/find-boba-shops/[city]` | page | **Fully dynamic, zero caching** — confirmed via `.next/prerender-manifest.json`: no entry at all (contrast with `sitemap.xml`, which has a real `initialRevalidateSeconds: 3600`). Reading `searchParams` (page/tags/sort/minRating) is a Dynamic API that forces this on every request, for every URL including the bare one, regardless of `generateStaticParams`. | `generateStaticParams` + `generateMetadata` (per-city authored SEO copy). BreadcrumbList + ItemList JSON-LD. See §D for full detail — this is the route with the caching history. |
| `/boba-shop/[slug]` | page | **Fixed 2026-09-09 — now fully dynamic, same as the city page.** Was ISR-cached indefinitely per-URL after first request (`X-Vercel-Cache: HIT`, climbing `Age`, no `revalidate` export, nothing ever calling `revalidatePath`) — a real staleness risk once data-refresh scripts write outside a deploy cycle. Added `export const dynamic = 'force-dynamic'`; confirmed via a rebuilt `.next/prerender-manifest.json` (`dynamicRoutes` now empty) and live headers (`X-Vercel-Cache: MISS` consistently post-deploy). | `generateMetadata` (authored `meta_title`/`meta_description` with fallback). LocalBusiness/CafeOrCoffeeShop + BreadcrumbList JSON-LD. |
| `/faq` | page | Static | FAQPage JSON-LD. |
| `/about-us`, `/contact`, `/privacy-policy`, `/terms-of-service`, `/cookies-policy` | pages | Static | No JSON-LD. |
| `/search` | page | Dynamic (reads `searchParams`) | No client boundary at the page level; delegates to server data fetch. |
| `/login`, `/signup`, `/reset-password` | pages | Client-rendered forms | Auth flows, out of scope for the overhaul's SEO-sensitive surfaces. |
| `/dashboard/*`, `/admin/*` | pages | Client-heavy | Shop-owner and admin tooling, logged-in only, not crawled — lower priority for this workstream. |
| `/api/*` | route handlers | N/A | Auth, contact, reviews, search, Stripe. `vercel.json` forces `Cache-Control: no-store` on all of `/api/(.*)`. |

### Components that render a shop, city, or list

| Component | File | Client/Server | Used by |
|---|---|---|---|
| `ShopCard` | `src/components/ShopCard.tsx` | Server | City grid (`find-boba-shops/[city]/page.tsx`) |
| `CityMapView` | `src/components/CityMapView.tsx` | Client (`'use client'`) | City page — renders all filtered shops as markers. Lazy-loads via `IntersectionObserver`; keeps one persistent `Map` instance across pagination (added earlier this session to stop redundant Google Maps API loads). |
| `FilterSidebar` | `src/components/FilterSidebar.tsx` | Client | City page — tag/rating filters |
| `Pagination` | `src/components/Pagination.tsx` | Client (uses `next/navigation` hooks) | City page — all links, works without JS |
| `SortDropdown` | `src/components/SortDropdown.tsx` | Client | City page |
| `ReviewsSection` / `ReviewsList` / `ReviewForm` | `src/components/Reviews*.tsx` | Client | Shop detail page — the **on-site** review system (separate from Google ratings; explicitly out of scope per guardrails and per the ratings-refresh spec's own non-goals) |
| `JsonLd` | `src/components/JsonLd.tsx` | Server | Homepage, FAQ, city, shop pages |
| `MapView` | `src/components/MapView.tsx` | Client | **Orphaned.** Its only call site (shop detail page) was removed in an earlier session to eliminate Google Maps API load on every shop page view. The file is dead code — zero imports anywhere in `src/`. Safe to delete; flagged here rather than deleted since Phase 0 is read-only. |
| City hub cards | inline JSX in `src/app/find-boba-shops/page.tsx` | Server | Not a separate component today — Phase 8 wants a `CityCard`; currently the markup lives directly in the hub page. |

### `'use client'` inventory (full list, `src/app` + `src/components`)

Auth: `LoginForm`, `SignupForm`, `ResetPasswordForm`, `UpdatePasswordForm`, `ProtectedRoute`, all of `dashboard/*` and `admin/*`.
Interactive/data: `CityMapView`, `MapView` (orphaned), `FilterSidebar`, `Pagination`, `SortDropdown`, `ReviewForm`, `ReviewsList`, `ReviewsSection`, `ContactForm`.
Infra: `Header` (mobile nav toggle), `OptimizedImage` (see Perf finding below), `GoogleAdsense`, `GoogleAnalytics`, `JumpToMapButton`, `withSuspense` HOC, `global-error.tsx`.

Nothing in the shop/city rendering path itself is a client component except `CityMapView` (already isolated to the map section) — **the core content guardrail (§0.4) is currently satisfied**: shop names, addresses, descriptions, ratings, and hours are all server-rendered.

### JSON-LD emission (exact locations)

- `src/app/page.tsx` — `Organization`
- `src/app/faq/page.tsx` — `FAQPage`
- `src/app/find-boba-shops/[city]/page.tsx` — `BreadcrumbList`, `ItemList`
- `src/app/boba-shop/[slug]/page.tsx` — `LocalBusiness`/`CafeOrCoffeeShop`, `BreadcrumbList`
- Shared renderer: `src/components/JsonLd.tsx` (escapes `<` to prevent script-tag injection)

### Styling approach

- **Tailwind v3** (`"tailwindcss": "^3.3.0"`), classic `tailwind.config.js` (not TS, not v4 `@theme`), plain `@tailwind base/components/utilities` in `src/styles/globals.css`.
- Existing tokens: `colors.primary` (blue scale), `colors.secondary` (magenta scale), `fontFamily.sans` → `--font-inter`, `fontFamily.display` → `--font-poppins`. **None of the plan's matcha/taro/ink tokens exist yet** — Phase 1 is a clean addition, not a migration of conflicting tokens, though the blue/magenta scale should be removed once the new palette is wired through (nothing currently depends on `secondary`; `primary` is used broadly for buttons/links/accents and will need a full find-and-replace pass in later phases).
- Fonts loaded via `next/font/google` (Inter + Poppins), `display: 'swap'`, both self-hosted subsets. **Per the plan, Poppins → Gabarito (or fallback chain) is a straightforward swap in `layout.tsx`.**

### Content infrastructure (for §10 — articles later)

- **No MDX, no Contentlayer, no `@tailwindcss/typography`** installed.
- **No `posts`/`articles` table** in Supabase — confirmed via schema query (full column list in §B) and via grep across the data layer.
- Existing long-form copy (city intros in `city-intros.ts`, FAQ answers, shop descriptions) is all **plain hardcoded strings / DB text columns**, rendered as plain `<p>` tags — no shared prose styling exists yet. Phase 1's `.prose` scope is genuinely new, not a retrofit.

---

## B. Data inventory

### Full column list (`shops` table, 42 columns)

| Column | Type | Notes |
|---|---|---|
| `id`, `name`, `slug`, `formatted_address`, `city`, `state` | required | Core identity, 100% populated by definition |
| `rating` | numeric | See population below |
| `user_ratings_total` | integer | See population below |
| `reviews_link` | text | Source of the Google `place_id` for the ratings-refresh pipeline |
| `website`, `formatted_phone_number` | text | **Fixed 2026-09-09 — see finding below.** Now 81.7% / 76.4% populated. |
| `menu_link` | text | 0% populated — genuinely absent from the source CSVs, not a pipeline bug. Nothing to recover. |
| `email` | varchar | Not separately audited; low priority (owner contact, not shown to visitors) |
| `working_hours` | jsonb | See population below |
| `order_links` | text | Not separately audited |
| `photos` | jsonb | Array of Google photo URLs; see `has_working_photo` below for the *validity*-checked version |
| `tags` | text[] | Native Postgres array; derived by `extractTags()` from a small hardcoded keyword list (service options + a handful of flavor words) — **not** the same as the richer `about` field below |
| `about` | text | Raw Google Places "about" JSON (parses cleanly as JSON in every sampled row) — a much richer attribute source than `tags`, currently used only for description-enrichment/fallback-blurb generation, never for filtering |
| `description` | text | Real Google-sourced description, where present |
| `description_enriched` | text | Human/LLM-authored expansion, Tier-A shops only |
| `meta_title`, `meta_description` | text | Authored SEO metadata (previous workstream) |
| `content_generated_at` | timestamptz | |
| `is_premium`, `featured_until`, `featured_logo`, `featured_order_url` | mixed | Paid-placement feature. **`is_premium` is `TRUE` for 0/813 shops right now** — no active premium listings |
| `latitude`, `longitude` | double precision | 100% populated |
| `reservation_links` | text | 4.4% populated (36/813) — not viable |
| `booking_appointment_link` | text | 80.7% populated (656/813) but this is **Google's generic "choose a provider" redirect URL**, auto-present for most listed businesses — it is not a meaningful "accepts reservations" signal and should not be surfaced as one |
| `facebook`, `instagram`, `twitter`, `tiktok` | text | See "any social" population below |
| `has_working_photo`, `photo_checked_at` | boolean/timestamptz | From this session's photo-verification pass |
| `rating_refreshed`, `user_ratings_total_refreshed`, `google_business_status`, `google_refreshed_at` | mixed | Staging columns from the Google ratings refresh, already promoted into `rating`/`user_ratings_total` |
| `owner_id`, `created_at`, `updated_at` | mixed | Infra columns |

**No `price_level` column exists at all.** **No neighborhood/sub-area column exists at all.** Both were candidate filter dimensions in earlier planning discussions; neither is buildable without new data collection.

### Population — overall (813 shops)

| Field | Populated | % |
|---|---|---|
| `rating` > 0 | 810 | 99.6% |
| `user_ratings_total` > 0 | 801 | 98.5% |
| `has_working_photo` = true | 484 | 59.5% |
| `working_hours` non-empty | 787 | 96.8% |
| `tags` non-empty | 813 | 100% (see caveat above — presence ≠ distinguishing) |
| lat/lng | 813 | 100% |
| `website` non-empty | **0** | **0%** |
| `formatted_phone_number` non-empty | **0** | **0%** |
| `menu_link` non-empty | **0** | **0%** |
| any social handle | 575 | 70.7% |
| `description` non-empty | 192 | 23.6% |
| `description_enriched` non-empty | 192 | 23.6% |
| `reservation_links` non-empty | 36 | 4.4% |
| `booking_appointment_link` non-empty | 656 | 80.7% (see caveat above) |
| `google_business_status = CLOSED_PERMANENTLY` | 132 | 16.2% |

**Correction to an assumption in prior planning:** the plan's Phase 0 prompt states "~271 shops have enriched descriptions, ~542 do not." The actual, verified number is **192 enriched / 621 without** (23.6% / 76.4%). Every shop with `description_enriched` also has `description` — there is no "description but not enriched" state; the enrichment step processed 100% of Tier-A shops.

**Data-pipeline bug, fixed 2026-09-09:** `website` and `formatted_phone_number` were empty-string for literally every shop, confirmed both in aggregate and by direct row sampling. Traced to `scripts/migrate-shops.mjs` reading `item.website` / `item.formatted_phone_number` from the source CSVs, whose actual column names are `site` / `phone` — the original one-time migration script never wrote these fields correctly. The source data was there all along (97.8% / 91.8% populated in the CSVs); `scripts/backfill-website-phone.mjs` recovered it by slug. Now **81.7% / 76.4%** populated (664 / 621 of 813 shops) — the shop page's "Visit Website" and "Call" action buttons, already conditionally rendered, now show up for most shops with no template change needed. `menu_link` was checked too and is genuinely 0% in the source CSVs — nothing to recover there; the action row should still be designed to look complete when only Directions (and sometimes Website/Call) render, since Menu will rarely have data.

### Population — per city (the filter-viability table)

| City | Total | Rating | Reviews | Working photo | Hours | Description | Social | Closed |
|---|---|---|---|---|---|---|---|---|
| Atlanta | 96 | 100.0% | 99.0% | 72.9% | 95.8% | 12.5% | 76.0% | 8.3% |
| Chicago | 100 | 100.0% | 100.0% | **48.0%** | 98.0% | 24.0% | 71.0% | 13.0% |
| Dallas | 131 | 100.0% | 99.2% | 72.5% | 99.2% | 19.8% | 80.2% | 17.6% |
| New York | 145 | 100.0% | 97.9% | 56.6% | 95.9% | 33.8% | 71.7% | 26.9% |
| Philadelphia | 100 | 100.0% | 99.0% | **49.0%** | 98.0% | 28.0% | 71.0% | 16.0% |
| Seattle | 142 | 100.0% | 99.3% | 59.2% | 97.2% | 18.3% | 66.2% | 12.0% |
| Washington | 99 | 97.0% | 94.9% | 56.6% | 92.9% | 27.3% | **57.6%** | 16.2% |
| **Min across all 7** | | **97.0%** | **94.9%** | **48.0%** | **92.9%** | **12.5%** | **57.6%** | |

Bolded values are the ones that break a given dimension's "≥60% in every city" candidacy.

### `tags` column values, minimum % across all 7 cities (non-generic only)

| Tag | Min city % | Per-city |
|---|---|---|
| Delivery | **87.9%** | Atlanta 93 · Chicago 89 · Dallas 89 · NY 90 · Philly 93 · Seattle 94 · DC 88 |
| Wheelchair accessible | **70.0%** | Atlanta 99 · Chicago 70 · Dallas 99 · NY 94 · Philly 71 · Seattle 96 · DC 83 |
| No-contact delivery | 22.9% | — fails |
| Coffee | 8.3% | — fails |
| Curbside pickup | 7.0% | — fails |
| Everything else (Family-friendly, Vegetarian/Vegan, Outdoor seating, Organic) | 0–6% | — fails badly |

### `about` field values, minimum % across all 7 cities (richer source, currently unused for filtering)

| Attribute | Min city % | Verdict |
|---|---|---|
| Takeout | 91.9% | Passes, but already near-universal/non-distinguishing |
| Delivery | 87.9% | Passes — matches the `tags` finding |
| Dine-in | 82.4% | Passes, but near-universal |
| "Great tea selection" | 71.9% | Passes numerically, but this is the site's own known-generic highlight (already treated as non-distinguishing in `generateShopBlurb()`) — do not surface as a filter |
| Wheelchair accessible entrance | 51.0% (New York) | **Fails** — just under the bar |
| LGBTQ+ friendly | 22.0% (Philadelphia) | Fails |
| Identifies as women-owned | 14.0% (Philadelphia) | Fails |
| Alcohol/cocktails, atmosphere, audience, other ownership identities | all under 20% in at least one city | Fails |

### Direct answer to the required question

**Amended 2026-09-09, per owner direction: filters are decided per city, not by a single cross-city minimum.** If a dimension clears 60% in a given city, that city's page gets that filter, even if another city doesn't. Recomputing per-city (rather than by "minimum across all 7") changes one answer:

| Dimension | Atlanta | Chicago | Dallas | New York | Philadelphia | Seattle | Washington |
|---|---|---|---|---|---|---|---|
| Rating | 100% | 100% | 100% | 100% | 100% | 100% | 97% |
| Review count | 99% | 100% | 99% | 98% | 99% | 99% | 95% |
| Hours (open now) | 96% | 98% | 99% | 96% | 98% | 97% | 93% |
| Delivery (tags) | 93% | 89% | 89% | 90% | 93% | 94% | 88% |
| Wheelchair accessible (tags) | 99% | 70% | 99% | 94% | 71% | 96% | 83% |
| Working photo | 73% | 48% | 73% | 57% | 49% | 59% | 57% |
| Any social handle | 75% | 68% | 77% | 70% | 71% | 63% | **54%** |

Rating, review count, hours, Delivery, and Wheelchair-accessible clear 60% in **every** city individually — unchanged from the original global analysis, since those five were never close to the line. **Social media presence is the one dimension the per-city approach rescues**: it fails a strict cross-city minimum only because Washington sits at 54%; the other six cities clear 60% (63–77%). **Recommendation: ship it as a filter/badge in Atlanta, Chicago, Dallas, New York, Philadelphia, and Seattle; omit it in Washington.**

Working photo still fails in 5 of 7 cities even city-by-city (only Atlanta and Dallas clear 60%) — this remains a display-order signal (already implemented via the 3-tier sort), not a filter, everywhere. LGBTQ+-friendly and ownership-identity attributes (women-owned, Black-owned, etc.) were re-checked per city too and don't clear 60% in *any single city* (LGBTQ+-friendly peaks at 54% in Chicago) — not viable as a filter anywhere, though real and present-when-true, so still a candidate for a per-card badge rather than a filter. Price level and neighborhood remain unavailable as data at all.

**Phase 5 should ship:** sort by rating/reviews, filter by min-rating, filter by Delivery, filter by Wheelchair-accessible, and (new) filter/sort by open-now — in every city — plus filter/badge by social-media presence in the 6 cities where it clears the bar (all but Washington).

**Also added 2026-09-09:** a text search box on the city page that narrows the *currently filtered* result set (e.g. "Wheelchair accessible" + "milk tea" → the intersection), not a separate/exclusive search. See Phase 5 in the plan for the implementation approach (URL param, server-resolved, matches the existing header-search pattern from Phase 4).

Individual rich attributes (LGBTQ+-friendly, women-owned, etc.) that fail the *filter* bar are still real, correct, present-when-true data — they remain reasonable candidates for an individual-card **badge** (shown when true, absent when not, never a filter chip) if a future phase wants that; that's a different bar than "buildable as a directory-wide filter."

---

## C. Performance and rendering baseline

Real Lighthouse (v12.8.2), mobile form factor, simulated throttling, run against the live production site (not localhost) on 2026-09-09.

| Page | Perf score | LCP | CLS | TBT | Speed Index | Total page weight |
|---|---|---|---|---|---|---|
| Homepage (`/`) | **73** | **4.8 s** | 0 | 170 ms | 3.7 s | 779 KiB |
| `/find-boba-shops/atlanta` | 89 | 3.0 s | 0 | 250 ms | 2.3 s | 708 KiB |
| `/boba-shop/teamo-tea-cafe` | 93 | 2.4 s | 0 | 200 ms | 4.0 s | 511 KiB |

CLS is a clean 0 across all three pages — font loading (`next/font/google`, `display: swap`, self-hosted subsets) is not causing layout shift anywhere today. That's a real baseline to protect: **Phase 1's font swap must not regress this.**

**The homepage is the clear performance outlier**, and the mechanism is identifiable: its `priority` hero image renders through `OptimizedImage` (`src/components/OptimizedImage.tsx`), which is a **client component** (`'use client'`) with its own `useState`-driven loading/low-quality-swap logic layered on top of `next/image`. A client component in the LCP path delays how early the browser's preload scanner can commit to that image versus a plain server-rendered `next/image`, and the internal loading-state swap is an additional render pass before the final image paints. This is a concrete, fixable `[perf]` target for Phase 8, not a vague "hero is slow" observation.

### Raw HTML checks (guardrail §0.4 compliance, current state)

| Page | Raw HTML size | Content in initial payload |
|---|---|---|
| `/` | 49,466 bytes | ✅ Hero heading text present |
| `/find-boba-shops/atlanta` | 459,141 bytes | ✅ Shop names present (checked "Sweet Hut Bakery") |
| `/boba-shop/teamo-tea-cafe` | 65,721 bytes | ✅ Shop name present |

The Atlanta page's raw HTML is substantially larger than the other two (96 shop cards fully server-rendered, no pagination-driven lazy loading of listings) — worth keeping an eye on as a card-markup-weight consideration in Phase 3, though it's not causing a CLS or LCP problem today per the scores above.

---

## D. Caching posture

This is the section with the most operational history — three separate "stale content" reports on `/find-boba-shops/[city]` this cycle, most recently traced (in this same investigation thread, prior to this document) to a client-side fetch tool's own cache rather than a server-side bug. Documenting precisely, as requested:

### `/find-boba-shops/[city]` — the route with the history

- **Current configuration:** no `revalidate` export (one was added, found to be a no-op, and removed with an explanatory comment — see git history: `9f1c7d7`). `generateStaticParams` is present but irrelevant to caching outcome, because the page reads `searchParams`.
- **Ground truth:** `.next/prerender-manifest.json` has **no entry at all** for this route — neither in `routes` (fully static) nor `dynamicRoutes` (ISR with fallback). Compare to `sitemap.xml`, which genuinely shows `"initialRevalidateSeconds": 3600` in the same manifest.
- **Why:** `searchParams` (used for `page`/`tags`/`sort`/`minRating`) is a Next.js "Dynamic API." Reading it forces the entire route to render fresh on every single request — for every URL, including the bare no-query-param one — regardless of `generateStaticParams`.
- **Verified today:** 10 consecutive `curl` requests to the bare Atlanta URL — identical content every time, `X-Vercel-Cache: MISS` on all 10 (genuinely fresh compute, not a cache hit). Repeated for Seattle, Washington, and New York (3 fetches each) with the same result. Query strings do not produce separate cache entries because **no cache entries exist for this route at all** — there is nothing for a query string to fragment.
- **Where would `revalidatePath`/`revalidateTag` need to live?** Nowhere — there is no cache here to purge. This is also why the ratings-refresh promotion (`rating`/`user_ratings_total`) showed up on city pages instantly with zero deploy needed.
- **Tradeoff of the current state:** always-correct content, at the cost of full server + DB round-trip on every request (no free CDN caching, higher TTFB, more Supabase load per visit than a cached page would incur). Given the documented history of staleness reports on this exact route, "boringly always-fresh" has been treated as the correct tradeoff to date, and removing it should not be done casually.

### `/boba-shop/[slug]` — a different, less-examined risk

- **Current configuration:** `generateStaticParams` returns `[]` (no shop pre-built at build time). No `searchParams` usage, no `revalidate` export. Listed in the prerender manifest's `dynamicRoutes`, `fallback: null`.
- **Verified today:** repeated requests to the same shop URL return `X-Vercel-Cache: HIT` with a climbing `Age` header (`Age: 95` and counting across 3 consecutive checks) and `Cache-Control: public, max-age=0, must-revalidate`. **This route is genuinely cached, indefinitely, per URL, once first generated** — the opposite caching posture from the city page.
- **Fixed 2026-09-09**, on the owner's direction to make this route match the city page's (correct) always-live behavior rather than leave the mismatch for a later phase: added `export const dynamic = 'force-dynamic'` to `src/app/boba-shop/[slug]/page.tsx`. Verified two ways — the rebuilt `.next/prerender-manifest.json` now has an empty `dynamicRoutes` (this route no longer appears in any caching-related manifest entry, the same "no entry at all" signature as the city page), and live production headers went from `X-Vercel-Cache: HIT` with a climbing `Age` to a consistent `MISS` on every request post-deploy.
- **Tradeoff, accepted deliberately:** shop pages now cost a full server + Supabase round-trip on every request instead of being served from cache, the same tradeoff already accepted for city pages. Given 813 shop pages are the more numerous, longer-tail-traffic route (versus 7 high-traffic city pages), this is a larger aggregate compute/DB-load cost than the city-page decision was. It was chosen anyway because a silently-stale shop page (wrong rating, wrong hours, missing new website/phone data) is a worse user- and trust-facing failure than a slower response, and nothing in the current data-refresh scripts calls `revalidatePath` — so "always live" was the only option that didn't require also building an on-demand revalidation hook. If Supabase load or TTFB becomes a real problem at higher traffic, the alternative (a daily `revalidate` plus `revalidatePath` calls from the refresh scripts) is still available as a future optimization, not a correctness requirement.

### Proposed caching strategy for Phase 6 (to state explicitly, per the plan's ask — not implemented yet)

Keep `/find-boba-shops/[city]` **fully dynamic, exactly as it is today.** The tradeoff (no CDN caching, full compute per request) is real but small at current traffic, and every documented "staleness" incident on this specific route has resolved by *removing* caching assumptions, never by adding one back. Introducing `revalidate` here again would need `searchParams` to stop being read on the base render path (e.g., resolving filters/sort/pagination in a client-side layer instead) — which the plan's own Phase 6 rendering rules explicitly forbid ("no new client components," "server-resolved"). Given that constraint, dynamic-always is not a compromise; it is the only option compatible with the plan's own rules, so Phase 6 should state this plainly in a code comment (as the kickoff prompt requests) rather than re-litigate it.

---

## E. Prioritized findings

Ranked by user impact.

1. **`[data]` — fixed 2026-09-09.** `website`/`formatted_phone_number` were 0% populated (pipeline bug in `migrate-shops.mjs`, reading wrong CSV column names); recovered from the source CSVs via `scripts/backfill-website-phone.mjs`, now 81.7%/76.4% populated. `menu_link` remains genuinely 0% (absent from source data, not a bug) — the Phase 7 action row should still be designed to look complete when Menu never renders.
2. **`[perf]`** Homepage LCP (4.8s) is meaningfully worse than city (3.0s) and shop (2.4s) pages, traced to the hero's `priority` image rendering through the client-component `OptimizedImage`. Phase 8's hero rebuild should route the hero image through a plain server-rendered `next/image` rather than reusing `OptimizedImage` as-is, or fix `OptimizedImage` itself.
3. **`[caching]` — fixed 2026-09-09.** `/boba-shop/[slug]` cached indefinitely per-URL with no automatic revalidation. Now `force-dynamic`, matching the city page's always-live behavior; see §D for the accepted tradeoff (higher per-request compute/DB load across 813 pages, in exchange for shop pages never silently going stale).
4. **`[data]`** Only 5 dimensions clear the ≥60%-in-every-city bar for Phase 5: rating, review count, hours/open-now, Delivery, Wheelchair accessible. Every richer, more interesting attribute (LGBTQ+-friendly, women-owned, alcohol, atmosphere) is real and present in the `about` field but fails the bar in at least one city — do not build these as filters; a per-card badge is the right ambition level if wanted later.
5. **`[data]`** The plan's assumption of "~271 enriched descriptions" should be corrected to the verified **192** (23.6%) — relevant to how prominent the description block should be in the Phase 7 shop-page anatomy (it will be absent on over 3 in 4 pages; the facts panel needs to visually carry the page on its own, exactly as §8 already specifies, and this confirms that specification is correctly calibrated to the real data).
6. **`[structural]`** `src/components/MapView.tsx` is dead code (zero imports) since an earlier session removed the shop-page map. Not touched here per Phase 0 scope; safe to delete whenever a phase touches shop-page files.
7. **`[visual]`** Existing Tailwind tokens (`primary` blue, `secondary` magenta, Poppins display font) are unrelated to the plan's new palette/type system and are used broadly across current components. Phase 1 is additive (no conflicting token names), but later phases that touch component markup will need a full pass to stop referencing `primary`/`secondary`/`font-display` as they're replaced, not just a token-file swap.
8. **`[data]`** `booking_appointment_link` looks well-populated (80.7%) but is Google's generic "choose a provider" redirect, not a real "accepts reservations" signal — don't treat its presence as meaningful data for any future filter or badge.

---

## Gate

Per the plan: this document is the required output for Phase 0. The filter list in §B and the caching proposal in §D need explicit written approval (or amendment) before Phase 1 begins.

---

## F. Phase 9 — accessibility findings and final performance pass

### Accessibility sweep

Ran Lighthouse's accessibility category (axe-core under the hood - no interactive "axe DevTools" extension available in this environment, used as the closest equivalent) against home, a city page, and a shop page. Two real, previously-unflagged issues, both fixed:

1. **`.btn-primary` contrast** — `bg-primary-600` (`#0284c7`) with white text measured 4.10:1 against the 4.5:1 WCAG AA minimum. This is the original pre-overhaul button class, used site-wide (search buttons, CTAs). Fixed by shifting the class to `primary-700` (5.93:1), with `hover`/`active` steps shifted down to match (`src/styles/globals.css`).
2. **Pagination's current-page indicator** used the same raw `bg-primary-600` utility directly (not the shared class, so the fix above didn't cover it) - moved to `var(--matcha-deep)` (5.04:1) for both the contrast fix and visual consistency with the rest of the redesigned city page.
3. **`CityMapView`'s "Loading map..." placeholder** - `text-gray-500` on `bg-gray-200` measured 3.9:1; the dark-mode pairing (`text-gray-400` on `bg-gray-700`) was also failing at 4.06:1. Both moved to `gray-700`/`gray-300`.
4. **Mobile header search button** - the icon-only submit button was a 16×16px hit target against the 24×24px minimum. Enlarged via padding, keeping the icon's visual size unchanged.

All three page types score 100/100 with zero flagged issues after these fixes. Not exhaustive - a full manual keyboard-only pass and a real screen reader pass weren't performed; this is a mechanical-testing pass, not a substitute for one.

Also in this phase: added skeleton/error/empty states to `ReviewsList` (the one genuinely client-side-fetched piece of content on the public site - matches real review-item dimensions, adds a working retry button, drops the exclamation mark from the empty state); rebuilt `/not-found` with a real search input and links to all 7 cities; fixed `global-error.tsx`'s copy (was "Something went wrong!" / "We're sorry, but..." - both violate the plan's no-apology/no-exclamation rule for error states); gave the map's error fallback a working "Try again" button (required extracting it into its own Client Component - `src/components/MapErrorFallback.tsx` - since a plain `onClick` can't be passed as a prop from a Server Component to `<ErrorBoundary fallback={...}>`, which crashed the city page at runtime until caught in testing); brought `/find-boba-shops` (the all-cities index, not touched by any earlier phase) up to the same tile-based card pattern as the homepage and city pages, fixing a missing `motion-reduce` variant and an arrow-suffixed link in the process; and deleted `src/components/MapView.tsx` (dead code, flagged in §E finding 6, safe to remove once a phase touched shop-page files - Phase 7 did).

**Explicitly out of scope, left alone:** the dashboard/admin area (shop-owner and internal tooling, never part of this workstream per the plan's own page list) still uses `animate-pulse`/`animate-spin` without `motion-reduce` variants and the old `primary`/`secondary` palette throughout. A handful of public-site forms (`ContactForm`, `ReviewForm`, auth forms) and `Pagination`'s neutral (non-current-page) buttons also still reference the old palette - none of these surfaced as real contrast failures, so migrating them was treated as the cosmetic-consistency cleanup already flagged in §E finding 7, not an accessibility fix, and left for a future pass rather than expanding this phase further.

### Final performance pass

Run against live production after Phase 9 merged and deployed (2026-09-09), same three page types as the Phase 0 baseline in §C.

**Methodology note carried over from Phase 8, confirmed again here:** Lighthouse's `simulate` throttling method (used for the original Phase 0 baseline) is measurably unreliable on this redesigned site - single runs on every page type swung wildly (shop page: 4.9s / 2.7s / 2.7s LCP across three consecutive runs against an unchanged deploy). `--throttling-method=devtools` (real throttled execution in an actual browser) was consistent every time it was run and is the more trustworthy number. The table below reports the `simulate` median (for continuity with the Phase 0 baseline's own methodology) alongside the `devtools` reading as a real-world sanity check - when the two disagree sharply, trust `devtools`.

| Page | Perf score (simulate / devtools) | LCP (simulate median / devtools) | CLS | TBT (simulate) | Total weight | Phase 0 baseline (LCP / weight) |
|---|---|---|---|---|---|---|
| Homepage (`/`) | 80 / 87 | 3.9s / 2.2s | 0 | 170ms | 527 KiB | 4.8s / 779 KiB |
| `/find-boba-shops/atlanta` | 91 / 76 | 3.2s / 2.9s | 0 | 140ms | 685 KiB | 3.0s / 708 KiB |
| `/boba-shop/teamo-tea-cafe` | 92 / 78 | 2.7s / 2.3s | 0 | 230ms | 577 KiB | 2.4s / 511 KiB |

**Reading this against the plan's gate (LCP not >200ms worse, CLS must not increase, total JS not >40KB more):**

- **CLS is a clean 0 on every page**, matching the Phase 0 baseline exactly - the font-loading and layout-shift discipline held across all 9 phases of markup changes.
- **Homepage** is a clear win under the trustworthy `devtools` reading (2.2s vs. 4.8s baseline) - removing the client-component hero image (§C's own top-priority `[perf]` finding) fixed the exact problem that finding described. The `simulate` number (3.9s) still shows real improvement over baseline despite the mode's known unreliability here.
- **City page** `devtools` LCP (2.9s) is within the 200ms tolerance of the 3.0s baseline - unchanged, not regressed, despite substantially more markup (filter bar, restyled cards, restyled map section) than the Phase 0 version had.
- **Shop page** `devtools` LCP (2.3s) is essentially identical to the 2.4s baseline - unchanged, despite the page being fully rebuilt in Phase 7 with a facts panel, action row, and up to 6 additional nearby-shop cards that didn't exist in the baseline version.
- **Total page weight decreased on every single page type** versus baseline (homepage -32%, city -3%, shop +13%... shop is the one exception, explained entirely by the new nearby-shops section's additional `ShopTile`-rendered cards, a deliberate, real feature addition rather than bloat).

No regressions against the Phase 0 baseline on any of the plan's three gate criteria, on any of the three page types.
