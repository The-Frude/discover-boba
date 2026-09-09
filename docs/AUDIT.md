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
| `/boba-shop/[slug]` | page | **ISR, cached indefinitely per-URL after first request** — in `dynamicRoutes` in the manifest, `fallback: null`, no `revalidate` export. `generateStaticParams` returns `[]`, so no shop page is pre-built; the first visit to any slug renders and caches it, and it is then served `X-Vercel-Cache: HIT` on every subsequent request until the next deploy (which purges the whole Full Route Cache) or an explicit on-demand revalidation (not currently triggered anywhere). **This is a real, currently-latent staleness risk** — see §D. | `generateMetadata` (authored `meta_title`/`meta_description` with fallback). LocalBusiness/CafeOrCoffeeShop + BreadcrumbList JSON-LD. |
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
| `website`, `formatted_phone_number`, `menu_link` | text | **0% populated — see finding below** |
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

**Data-pipeline bug, not a display bug:** `website`, `formatted_phone_number`, and `menu_link` are empty-string (not populated) for literally every shop, confirmed both in aggregate and by direct row sampling. This traces to `scripts/migrate-shops.mjs` reading `item.website` / `item.formatted_phone_number` from the source CSVs, whose actual column names are `site` / `phone` — the original one-time migration script never wrote these fields correctly. Practical effect: the shop page's "Visit Website" and "Call" action buttons never render for any of the 813 shops, and the plan's Phase 7 action row will only ever show Directions and (rarely) Menu unless this is fixed. **This is outside the UI overhaul's scope to fix, but the UI should not be designed assuming these fields will populate** — flagged as `[data]` in §E.

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

**Filter/sort dimensions supported by data populated on ≥60% of shops in every city:**

1. **Rating** (sort + min-rating filter) — already built, keep.
2. **Review count** (sort) — already built, keep.
3. **Working hours / "Open now"** (92.9–99.2%) — populated well enough to build, **not currently built as a filter or status line anywhere** (hours are displayed on the shop page, but no "open now" computation exists in the codebase today — this would be new logic, not a wire-up of something existing).
4. **Delivery** (87.9–94%, via the `tags` column, already extracted) — viable as a filter chip.
5. **Wheelchair accessible** (70–99%, via `tags`) — viable as a filter chip.

**Everything else fails the bar in at least one city**, including photo (Chicago 48%, Philadelphia 49%), any-social (Washington 57.6%), description (12.5–33.8% everywhere), and every richer `about`-derived attribute (LGBTQ+, ownership identity, alcohol, atmosphere). Price level and neighborhood aren't available as data at all. **Phase 5 should ship exactly: sort by rating/reviews, filter by min-rating, filter by Delivery, filter by Wheelchair accessible, and (new) filter/sort by open-now.** That's it — five real, always-working dimensions beat a longer list of half-empty ones.

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
- **Implication:** once a shop page has been visited (and thus cached), it will keep serving that cached HTML — including stale `rating`, `description`, hours, everything — until either (a) a full redeploy (which purges the entire Full Route Cache, resetting every shop page), or (b) an explicit on-demand `revalidatePath`/`revalidateTag` call, which **nothing in the codebase currently triggers**. Today's ratings-refresh and description work appeared to "just work" without a deploy earlier this session; that was very likely because those specific pages hadn't been cached yet at the moment of testing (or a deploy in the same window reset the cache), not because the route lacks a cache. This has not yet caused a *visible* bug only because deploys have been frequent during this active development period — it will become a real, silent staleness problem in steady state (e.g., after the monthly Places API refresh the plan's Phase 4 footer copy references), if refresh scripts don't call for revalidation.
- **Recommendation for Phase 6/7 (not implemented here per Phase 0 scope):** add either a scheduled `revalidate` (e.g., daily) to `/boba-shop/[slug]`, or have `scripts/refresh-google-ratings.mjs` and the content-generation scripts hit an internal revalidation API route after writing to the DB. A daily `revalidate` is the lower-effort, lower-risk choice and matches the actual cadence data changes at (nothing here needs to be fresher than a day).

### Proposed caching strategy for Phase 6 (to state explicitly, per the plan's ask — not implemented yet)

Keep `/find-boba-shops/[city]` **fully dynamic, exactly as it is today.** The tradeoff (no CDN caching, full compute per request) is real but small at current traffic, and every documented "staleness" incident on this specific route has resolved by *removing* caching assumptions, never by adding one back. Introducing `revalidate` here again would need `searchParams` to stop being read on the base render path (e.g., resolving filters/sort/pagination in a client-side layer instead) — which the plan's own Phase 6 rendering rules explicitly forbid ("no new client components," "server-resolved"). Given that constraint, dynamic-always is not a compromise; it is the only option compatible with the plan's own rules, so Phase 6 should state this plainly in a code comment (as the kickoff prompt requests) rather than re-litigate it.

---

## E. Prioritized findings

Ranked by user impact.

1. **`[data]`** `website`, `formatted_phone_number`, and `menu_link` are 0% populated across all 813 shops (pipeline bug in `migrate-shops.mjs`, reading wrong CSV column names). The Phase 7 action row will only ever render Directions reliably; Call/Website/Menu buttons will almost never appear. Design the action row to look complete with just Directions present, not as if the others are "missing."
2. **`[perf]`** Homepage LCP (4.8s) is meaningfully worse than city (3.0s) and shop (2.4s) pages, traced to the hero's `priority` image rendering through the client-component `OptimizedImage`. Phase 8's hero rebuild should route the hero image through a plain server-rendered `next/image` rather than reusing `OptimizedImage` as-is, or fix `OptimizedImage` itself.
3. **`[caching]`** `/boba-shop/[slug]` caches indefinitely per-URL with no automatic revalidation and nothing in the codebase ever triggers on-demand revalidation. Currently invisible because deploys have been frequent; will cause real, silent staleness once the site is in steady-state and refreshed monthly. Not urgent for this UI workstream, but Phase 6/7 should not assume shop-page data is always fresh, and this is worth a follow-up fix (daily `revalidate` or `revalidatePath` from the refresh scripts) alongside or shortly after this workstream.
4. **`[data]`** Only 5 dimensions clear the ≥60%-in-every-city bar for Phase 5: rating, review count, hours/open-now, Delivery, Wheelchair accessible. Every richer, more interesting attribute (LGBTQ+-friendly, women-owned, alcohol, atmosphere) is real and present in the `about` field but fails the bar in at least one city — do not build these as filters; a per-card badge is the right ambition level if wanted later.
5. **`[data]`** The plan's assumption of "~271 enriched descriptions" should be corrected to the verified **192** (23.6%) — relevant to how prominent the description block should be in the Phase 7 shop-page anatomy (it will be absent on over 3 in 4 pages; the facts panel needs to visually carry the page on its own, exactly as §8 already specifies, and this confirms that specification is correctly calibrated to the real data).
6. **`[structural]`** `src/components/MapView.tsx` is dead code (zero imports) since an earlier session removed the shop-page map. Not touched here per Phase 0 scope; safe to delete whenever a phase touches shop-page files.
7. **`[visual]`** Existing Tailwind tokens (`primary` blue, `secondary` magenta, Poppins display font) are unrelated to the plan's new palette/type system and are used broadly across current components. Phase 1 is additive (no conflicting token names), but later phases that touch component markup will need a full pass to stop referencing `primary`/`secondary`/`font-display` as they're replaced, not just a token-file swap.
8. **`[data]`** `booking_appointment_link` looks well-populated (80.7%) but is Google's generic "choose a provider" redirect, not a real "accepts reservations" signal — don't treat its presence as meaningful data for any future filter or badge.

---

## Gate

Per the plan: this document is the required output for Phase 0. The filter list in §B and the caching proposal in §D need explicit written approval (or amendment) before Phase 1 begins.
