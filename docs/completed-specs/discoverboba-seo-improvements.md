> **Status: implemented 2026-08-23.** Priorities 1-6 are all done. Priority 1
> and 6's rendering code is live, but the `description`/`reservation_links`/
> social-handle columns still need the schema migration and backfill in
> `scripts/add-description-and-links-to-shops.sql` and
> `scripts/backfill-shop-descriptions.mjs` run against production before
> that data actually shows up.

# DiscoverBoba.com — SEO / LLM-Friendliness / UX Improvement Spec

**Repo:** github.com/The-Frude/discover-boba
**Stack:** Next.js (App Router) + TypeScript + Tailwind, CSV-backed data in `/data`, deployed on Vercel
**Goal:** Increase organic + AI-answer-engine traffic and improve on-page quality ahead of pushing ad revenue. This spec covers on-page/technical SEO only — no redesign, no new features beyond what's listed.

Work through the priorities in order. Run `npm run build` after each section to confirm nothing breaks before moving on. Don't touch anything not listed here (see "Leave alone" at the bottom).

---

## Priority 1 — Render the shop descriptions that already exist

The CSVs in `/data` have a `description` column with real, unique text pulled from Google (e.g. "Bubble tea specialist with a selection of other hot & cold drinks, including coffee & slushes."). It's currently not rendered anywhere. Coverage varies by city (roughly 15–35% of rows have it populated).

**File:** `src/app/boba-shop/[slug]/page.tsx`

1. Add an "About [Shop Name]" section near the top of the page (after the header, before Hours/Contact) that renders `shop.description` when present.
2. For shops where `description` is empty: write a short original 1–2 sentence blurb using the data that *is* available — the `about`/tags field, service options (takeout/delivery/etc.), and city. Vary sentence structure and word choice shop-to-shop; don't reuse the same template phrasing across hundreds of pages, since repetitive templated text reads as thin content even when technically "unique" per page.
3. Confirm `getShopBySlug` in `src/utils/data.ts` actually exposes the `description` field from the CSV row (check the Shop type/interface includes it).

**Acceptance:** every shop page has at least one sentence of real descriptive text, not just structured facts (hours/address/tags).

---

## Priority 2 — Fix the rating/review display

**File:** `src/app/boba-shop/[slug]/page.tsx` (around line 298–321)

Currently: `{shop.reviews || shop.user_ratings_total} reviews` — the fallback logic is fine, but for many shops `user_ratings_total` is genuinely 0 in the source data while `rating` is still populated (e.g. 5.0), so the page shows a 5-star rating backed by "0 reviews." That's a trust problem for users and a liability if `aggregateRating` schema ever gets added on top of it (Priority 3).

**Task:** when the resolved review count is 0, don't render the star rating at all. Show something like "No reviews yet — be the first to review!" linking to the review form instead.

**Acceptance:** no shop page shows a star rating next to "0 reviews."

---

## Priority 3 — Add structured data (JSON-LD)

None currently exists anywhere in `src/` (verified — no `application/ld+json`, no schema.org references).

1. **`src/app/boba-shop/[slug]/page.tsx`** — add `LocalBusiness` (or `CafeOrCoffeeShop` if more specific fits) JSON-LD: `name`, `address` (use `PostalAddress`), `telephone`, `url`, `openingHoursSpecification` (from `shop.opening_hours`/`working_hours`), `image`. **Only** include `aggregateRating` when the resolved review count (post-Priority-2 fix) is greater than 0 — never emit a rating with a zero review count.
2. **`src/app/faq/page.tsx`** — add `FAQPage` JSON-LD with `mainEntity` matching the visible Q&A pairs exactly (question text and answer text must match what's rendered — don't paraphrase).
3. **Shop and city pages** — add `BreadcrumbList` JSON-LD matching the visible breadcrumb trail (Home → City → Shop).
4. **`src/app/find-boba-shops/[city]/page.tsx`** — add `ItemList` JSON-LD enumerating the shops shown on that page/that page of pagination.

**Acceptance:** run each page type through Google's Rich Results Test and confirm no errors, and that emitted data matches visible page content (no mismatched/invisible structured data).

---

## Priority 4 — Canonical URLs

None currently exist anywhere (verified — no `canonical`, no `metadataBase` set).

1. **`src/app/layout.tsx`** — set `metadataBase: new URL('https://www.discoverboba.com')` in the root metadata export.
2. **`src/app/find-boba-shops/[city]/page.tsx`** — in `generateMetadata`, set an explicit `alternates: { canonical }` that always points to the clean, unparameterized city URL (`/find-boba-shops/[city]`), regardless of `page`, `tags`, `sort`, or `minRating` query params. This stops paginated and filtered views from being treated as separate duplicate pages.
3. **`src/app/boba-shop/[slug]/page.tsx`** — add the same `alternates: { canonical }` pointing to the clean shop URL.
4. Add canonicals to the remaining static pages (home, FAQ, about-us, find-boba-shops hub, contact) too, for completeness.

**Acceptance:** view-source on a paginated URL (`?page=3`) and a filtered URL (`?tags=delivery`) both show a `<link rel="canonical">` pointing to the clean base city URL.

---

## Priority 5 — City page intro content

**File:** `src/app/find-boba-shops/[city]/page.tsx`

Add a real 100–200 word intro paragraph above the shop grid — not boilerplate reused across every city. Should:
- Explicitly mention that the metro area includes nearby suburbs (this also explains why some listed shops show a different state — e.g. "Washington" includes nearby Maryland and Virginia communities). This turns the state-mismatch confusion from the earlier audit into expected, explained behavior instead of a data error.
- Reference the city by name enough to reinforce local relevance for search, without keyword-stuffing.

Given there are only 7 cities right now, this can be hand-written per city rather than templated — quality over automation here.

**Acceptance:** each of the 7 city pages has unique, city-specific intro copy (not a shared template with only the city name swapped).

---

## Priority 6 — Low-effort data you're not using yet (optional this phase, cheap if time allows)

The source CSVs also include `menu_link`, `reservation_links`, `booking_appointment_link`, and social handles (`facebook`, `instagram`, etc.) for some shops — none currently rendered. If time allows, add these as simple links/icons on the shop page ("View Menu," "Book a Table," social icons) where populated. Low effort, real user value, and a mild engagement/dwell-time signal.

---

## Leave alone (already solid — don't touch this phase)

- `src/app/sitemap.ts` and `src/app/robots.ts` — both are correctly implemented (dynamic sitemap covering all cities/shops, robots.txt correctly blocking `/api/`, `/_next/`, `/admin/`). No changes needed.
- `sentry.server.config.js` / `sentry.edge.config.js` and the resulting `baggage`/`sentry-trace` meta tags — this is normal Sentry APM behavior, not a bug. Do not remove.
- `MapView` / `CityMapView` components — known placeholder ("Loading map..." never resolves). Out of scope for this phase; flag separately if it should be a future task.

---

## Suggested order for a Claude Code session

Do Priority 1 and 2 first (fast, high-impact, low-risk). Then 3 and 4 together since they touch the same `generateMetadata` functions. Then 5. Treat 6 as a stretch goal. Commit after each priority section rather than one giant commit, so changes are easy to review/revert individually.
