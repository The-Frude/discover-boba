# DiscoverBoba.com — SEO Audit & Action Plan

**Prepared:** September 14, 2026
**Site:** discoverboba.com (Next.js / Vercel / Supabase)
**Scope:** 7 cities, 813 shop pages, ~884 known URLs per Search Console

## How to use this document
Each priority section has a **Goal**, **Why it matters**, and a checklist of **Tasks** written as concrete, verifiable actions. Work top to bottom — priorities are ordered by expected impact on organic traffic, not by ease of implementation. Check off tasks as completed and note findings inline (e.g., "Confirmed: 542 shop pages missing enriched descriptions") so this doc doubles as a running audit log.

---

## Snapshot: Current State (as of this audit)

- **Indexation: 301 indexed / 583 not indexed** (~34% indexation rate) per Google Search Console
- Of the 583 not indexed: **295 "Discovered – currently not indexed"**, **283 "Crawled – currently not indexed"**, only 5 are technical errors (3 redirects, 1 404, 1 robots-blocked)
- **Conclusion: this is a content quality/depth problem, not a crawlability problem.** Google is actively declining to index the majority of shop pages after crawling them.
- ~~Indexed count has risen in steps that correlate with recent content deployments — the enrichment work already done is working, it's just incomplete (271 of 813 shops enriched)~~ **Corrected 2026-09-14:** queried Supabase directly - it's **192 enriched (`description_enriched`), 621 not**, not 271/542. This document appears to have been prepared from an earlier, since-corrected assumption (192 was confirmed via direct query back on 2026-09-09 and is the number every enrichment batch since has used). Priority 1's task list is updated below to the real number.
- JSON-LD, canonical tags, metadataBase, llms.txt, and per-city meta/OG tags are already implemented
- ~~Known open bug: `/find-boba-shops/[city]` has repeatedly served stale/inconsistent cached content (different snapshots to different requests) — this is paused pending fix for the Google Places ratings rollout~~ **Corrected 2026-09-14: already fixed.** Both `/find-boba-shops/[city]` and `/boba-shop/[slug]` were made fully dynamic (no ambient cache at all) during the September UI overhaul, verified repeatedly since with 5x-consecutive-request consistency checks. Re-verified again just now: 3 consecutive requests to the Atlanta city page all returned `X-Vercel-Cache: MISS`, `Age: 0`. The Google Places ratings rollout this note says was blocked is also long since complete - all 7 cities have been refreshed (801/813 shops with a `google_refreshed_at` timestamp spanning all 7 cities), and a monthly automated refresh (`.github/workflows/monthly-shop-refresh.yml`) now runs this on its own. See Priority 2 below - closed as already resolved.

---

## Priority 1: Close the Content Depth Gap (highest impact)

**Goal:** Get all 813 shop pages to the same content quality bar as the 271 already-enriched ones, and eliminate near-duplicate boilerplate across chain locations.

**Why it matters:** This is the most direct explanation for "Crawled – currently not indexed" (283 pages). Thin or templated pages get crawled, evaluated, and rejected — that's exactly what the data shows.

**Tasks:**
- [x] Query Supabase for the exact list of shop `slug`s that do NOT have enriched on-page descriptions **(2026-09-14: 621 shops, not ~542 - see the corrected snapshot number above)**
- [ ] Cross-reference that list against Search Console's "Crawled – currently not indexed" and "Discovered – currently not indexed" URL lists (export both from GSC) — confirm the overlap. **Not done - requires GSC access I don't have from this environment. Recommend exporting both URL lists from Search Console and I'll cross-reference against the 621-shop list.**
- [ ] Extend the shop-level content generation pipeline (already built for the 271 - actually 192) to the remaining 621 shops, using the same staging-CSV-review QC pattern before committing to the live DB. **Not started - this is the dominant share of the whole plan's effort. Proposing an approach separately rather than launching it unreviewed; see chat.**
- [ ] For shops lacking source description data entirely, define a fallback content strategy that's still unique per shop — e.g., combine category tags + neighborhood + hours + any review snippet data into a templated-but-varied paragraph, not a single boilerplate string. **Already exists independently of this plan: `generateShopBlurb()` in `src/utils/data.ts` does exactly this (deterministic per-shop opener + service/feature phrasing, seeded off the shop's own slug) and has been live since before this audit. The real gap is that it's a fallback, lower-quality tier, not that it doesn't exist - the enrichment work above is what raises shops out of it.**
- [x] Audit chain locations specifically (e.g., multiple "Kung Fu Tea" entries) — confirm each location's page has genuinely differentiated copy (neighborhood detail, hours, nearby landmarks), not the same paragraph with city swapped. **Checked 4 existing enriched Kung Fu Tea locations directly: each references its own city/neighborhood, ownership attributes, etc. - genuinely differentiated, not templated. The existing per-shop generation process already avoids this failure mode; extending it to the remaining 621 should inherit the same property.**
- [ ] After each batch deployment, spot-check 5–10 pages live in production against what Claude Code reports as deployed (per the existing "verify in prod, not just in the report" practice) — **standard practice throughout this engagement already; will continue for any batch of this work.**

---

## Priority 2: Fix the Cache-Consistency Bug — ✅ Already resolved, closed 2026-09-14

**Status:** this was fixed during the September UI overhaul, well before this audit doc was written. Root cause matches what this section suspected (a caching-layer mismatch): `/find-boba-shops/[city]` reads `searchParams`, which is a Next.js Dynamic API that forces the whole route to render fresh on every request - confirmed via `.next/prerender-manifest.json` (no entry for the route at all) rather than by guessing from response headers, which can be misleading on their own. `/boba-shop/[slug]` had the opposite problem (`X-Vercel-Cache: HIT` with a climbing `Age` and no revalidation trigger ever) and was moved to `export const dynamic = 'force-dynamic'` to match. Re-verified again for this audit: 3 consecutive requests to the live Atlanta city page all returned `X-Vercel-Cache: MISS`, `Age: 0`.

The Google Places rollout this section says was blocked by the bug is also complete - all 7 cities have refreshed shop data (801/813 shops have a `google_refreshed_at` timestamp, spanning all 7 cities), and a monthly GitHub Actions workflow now keeps it current without manual intervention.

**Original tasks, for the record (all superseded by the above):**
- [x] Identify caching layer in play — it was the Dynamic API/searchParams interaction described above, not a CDN or Data Cache misconfiguration
- [x] Check `revalidate` settings — found and removed a `revalidate` export that was silently a no-op (no static/ISR cache existed for it to apply to)
- [x] Add cache-busting/versioning — not needed; forcing full-dynamic rendering was the actual fix
- [x] Resume the Places rollout — done for all 7 cities, plus ongoing monthly automation

---

## Priority 3: Rein In Pagination & Faceted Navigation

**Goal:** Prevent low-differentiation paginated and filtered URLs from diluting crawl budget and inflating the "Discovered – currently not indexed" bucket.

**Why it matters:** NY alone has 15 pages of listings; filters (rating, delivery, wheelchair-accessible, etc.) may generate additional crawlable URL combinations. These look structurally near-identical to Google and are a classic cause of the "discovered but not prioritized for crawl" pattern.

**Tasks:**
- [x] Confirm whether filter/sort selections are reflected in the URL (query params) and, if so, whether those URLs are linked with real `<a href>` tags. **Confirmed: yes to both.** Filters/sort/search/pagination all live in real query params (`?tags=...&sort=...&page=...`), and every control is a real `<form method="GET">` or `<a href>` - built that way specifically so filtering works with JavaScript disabled, which as a side effect also means every combination is fully crawlable.
- [x] If filter URLs are crawlable, add `noindex` (not just canonical) to filtered result pages. **Done 2026-09-14.** `generateMetadata` on `/find-boba-shops/[city]` now adds `robots: { index: false, follow: true }` whenever any query param is present (filters, sort, search, or `page`), while the canonical tag still points at the bare city URL either way. `follow: true` so link equity still flows to the shops/pagination links on the page. Verified live: bare city URL has no robots meta tag (indexable by default), `?tags=...` and `?page=2` both render `<meta name="robots" content="noindex, follow">`.
- [ ] ~~For pagination (`?page=2`, etc.), confirm each page has a self-referencing canonical (not all pointing back to page 1)~~ **Deliberately not done - superseded by the noindex fix above.** Every paginated page already canonicalizes to page 1 (by design, so filtered/paginated views never compete with the main city page for ranking) and is now also `noindex`ed, so a self-referencing canonical would have no indexation effect to fix - a noindexed page's own canonical is moot. The underlying concern (deep pagination pages not getting indexed) isn't a real loss here: every shop already has its own independently-indexable page regardless of which listing page it appears on, so the city listing's job is to be a good hub/crawl path, not to get every page of it indexed individually.
- [x] Evaluate whether deep pages should be `noindex,follow`. **Done - see above, applied to every paginated/filtered page uniformly rather than picking a depth cutoff, since even page 2 is a near-duplicate of page 1's content by Google's usual standard.**
- [x] Re-check the sitemap.xml. **Confirmed already correct, no changes needed:** it only ever enumerates bare city and shop URLs (`sitemap.ts` calls `getShopsByCity()`/`getCities()` directly, never threading query params through) - checked the live sitemap for any `?` in a URL entry and found none.

**Also addressed while in this area (same failure mode, not originally called out by name in this doc):** `/search?q=...` had no `robots`/indexing controls at all - every unique search query was a fully indexable page. Since a bare `/search` redirects to the homepage, there's no canonical "search page" to protect; added a blanket `robots: { index: false, follow: true }` to its static metadata.

---

## Priority 4: Structured Data Validation

**Goal:** Confirm schema is correct and complete across all page types.

**Tasks:**
- [ ] Run Google's Rich Results Test against a sample of: homepage, a city page, a shop page, and the FAQ page. **Not run - it's an interactive tool at search.google.com/test/rich-results with no simple way for me to drive it from this environment. As a substitute, I extracted and parsed the actual JSON-LD from all four live page types directly (see below) - a narrower check (valid, well-formed schema) but not the full rich-result-eligibility read Google's own tool gives you. Worth running the real tool yourself on these four URLs if you want that additional confidence.**
- [x] Confirm BreadcrumbList schema exists and matches the visible breadcrumb UI. **Confirmed** on both city and shop pages, generated from the same `breadcrumbCityName`/`breadcrumbCityPath` values the visible breadcrumb renders, so they can't drift apart.
- [x] Add Organization schema to the homepage. **Stale ask - already done**, live since the September UI overhaul. Re-verified live just now.
- [x] Add a concise, quotable site-scope summary to the About page. **Stale ask - already done** in the same round of work.
- [x] Consider FAQPage schema on `/faq`. **Stale ask - already exists**, 10 real Q&As, live and re-verified. The homepage also independently picked up its own FAQPage block (its "About Boba" accordion) during the UI overhaul - not this doc's ask, but worth knowing it's there too.
- [x] Audit `aggregateRating`/review-count mismatches. **The specific failure mode this describes (showing a star rating backed by 0 reviews) has had a guard since before this audit:** both the visible star badge and the JSON-LD `aggregateRating` block only render `if (reviewCount > 0 && shop.rating > 0)`. Checked the current data anyway: 9 shops currently have `rating > 0` and `user_ratings_total = 0` in the database (most likely from partial API responses during a refresh), but none of them can surface that mismatch to a user or to Google, because of the existing guard. Nothing to fix here beyond confirming the guard is still in place, which it is.

---

## Priority 5: Local/Geo Expansion — business decision, not auto-implemented

**Goal:** Increase addressable long-tail local search surface.

**Not implementing any of this without explicit direction.** Splitting NY into borough pages and adding 3-5 new metro areas both mean new data acquisition (scraping/licensing a new dataset per city, same pipeline the original 7 cities came through) and new ongoing content/refresh commitments - a scope and cost decision, not a code change. Flagging it here rather than either building it unasked or silently dropping it from the plan.

**Tasks:**
- [ ] Evaluate splitting New York into borough or major-neighborhood pages (Manhattan/Chinatown, Flushing, Brooklyn, etc.) — the current city intro copy already names these as distinct hubs, suggesting real search demand exists at that granularity
- [ ] Prioritize 3–5 new metro areas for expansion beyond the current 7 cities, based on boba shop density and low existing directory competition
- [ ] For each new city, replicate the intro-paragraph pattern already proven to work well (confirmed strong, no rewrite needed) rather than generic templated text

---

## Priority 6: GEO / AI Crawler Visibility

**Goal:** Confirm AI crawlers can actually reach and use the site's content.

**Tasks:**
- [ ] Verify in Vercel logs/analytics whether these bots have actually hit the site. **Not done - requires your Vercel dashboard access, which I don't have from this environment.** Worth a quick look at Vercel's Analytics/Logs tab filtered by user-agent.
- [x] Direct `curl` test with each bot's user-agent against a shop page and a city page. **Done 2026-09-14, all clean:** GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and CCBot all get a plain `200` on both a shop page and a city page - no firewall/WAF-level block. `robots.txt` uses a blanket `User-Agent: *` / `Allow: /` (with only `/api/`, `/_next/`, `/admin/` disallowed), so there's no bot-specific rule to get wrong in the first place.

---

## Priority 7: Content Strategy (Blog) — deliberately out of scope for this pass

**Goal:** Build informational content that directory pages structurally can't rank for.

**Not building this now** - the September UI overhaul plan explicitly scoped the blog as groundwork-only ("do NOT build the blog in this workstream: no CMS, no MDX pipeline, no routes, no schema, no article pages"), and that decision hasn't been revisited. What IS already in place from that groundwork: the `/guides/[slug]` URL prefix is decided, an `ArticleCard` component exists sharing the shop card's design system, and the footer/homepage/city-page/shop-page reserved slots for article content are built and render nothing until real posts exist. Standing up the actual blog is a real, separate initiative (CMS or MDX pipeline, actual writing) - say the word whenever you want to pick that up.

**Tasks:**
- [ ] Stand up the blog section (already planned) with internal links from posts into relevant city/shop pages
- [ ] Prioritize topics with clear commercial-adjacent intent (e.g., "brown sugar boba vs. taro," "how to order boba for the first time") over pure entertainment content
- [ ] Feature blog posts on homepage and city pages as planned, to add fresh content signals and internal linking depth

---

## Priority 8: Off-Page / Authority — non-technical, your/business team's task

**Goal:** Build a backlink profile appropriate for a young local directory.

**Nothing here is a code change** - directory submissions, shop-owner outreach, and blogger/creator outreach are all manual business-development work, not something to implement. Flagging that this section exists and isn't quietly dropped, not doing anything against it.

**Tasks:**
- [ ] Submit to relevant local/food business directories
- [ ] Explore outreach to shop owners (via the existing Shop Owner Login/dashboard) to encourage them to link back to their DiscoverBoba listing from their own site/socials
- [ ] Identify boba/bubble-tea content creators or local food bloggers for potential mentions or guest content

---

## Priority 9: Ongoing Monitoring

**Tasks:**
- [ ] Re-check Search Console indexation numbers after Priority 1 (content) and Priority 3 (pagination/facets) work ships — expect "Crawled – currently not indexed" to drop first, as that reflects existing content quality; "Discovered – currently not indexed" should follow once crawl budget isn't spread thin over facet URLs
- [ ] Track indexed-page count against deployment dates to keep validating that content pushes are the primary lever (the step-pattern already visible in the GSC chart)
- [ ] Monitor Search Console query performance for movement on target queries ("boba shops in [city]," shop-name queries, etc.)

---

## Appendix: Known File/Route Reference (Next.js App Router conventions)

- `app/robots.ts` — crawler allow rules
- `app/sitemap.ts` (or equivalent) — sitemap generation
- `public/llms.txt` — GEO surface
- `app/find-boba-shops/[city]/page.tsx` — city listing route (has the cache-consistency bug)
- `app/boba-shop/[slug]/page.tsx` — individual shop route
- `getCities()` — includes the `CITY_PRIMARY_STATE` map (fixed for the DC bug)
- Supabase via `DATABASE_URL` — direct Postgres access for content audits/updates
