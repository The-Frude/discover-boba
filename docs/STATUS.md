# DiscoverBoba.com — Status & Next Steps

**Last updated:** 2026-09-17. This is a living handoff doc — read it first in a fresh session, then update it as work progresses rather than letting it go stale.

## Where things stand

The site went through a full 9-phase UI/UX overhaul (`docs/UI-OVERHAUL-PLAN-09sep2026.md`, all phases merged to `main`), followed by an SEO audit and remediation pass (`docs/discoverboba-seo-audit-plan-14sep2026.md`). That audit doc is the primary source of truth for what's done vs. outstanding — read its per-priority checklists directly rather than trusting a summary here, since it's kept updated in place. Current priority status:

- **Priority 1 (content depth gap): done.** All 516 shops that lacked `description_enriched` now have it (680/680 active shops covered), written by parallel content-generation passes grounded in each shop's real Google-sourced data, verified live in production.
- **Priority 2 (cache bug): done**, was already fixed before the audit was written.
- **Priority 3 (pagination/facet noindexing): done.**
- **Priority 4 (structured data): done.**
- **Priority 5 (local/geo expansion): phase 1 done, phase 2 not started.** Phase 1 = NYC borough pages (`/find-boba-shops/new-york/[borough]`), shipped 2026-09-17. See "NYC borough pages" below for real numbers and what's gating the rest. Phase 2 = the new-metro-expansion question — **not started, this is the very next thing to pick up** (see "Next up" below).
- **Priority 6 (AI crawler access): mostly done.** curl tests with AI bot user-agents all clean; verifying real bot traffic in Vercel's logs still needs your dashboard access, not something I can check from here.
- **Priority 7 (blog): deliberately deferred**, not part of this pass. See "⚠️ Needs your attention" below — there's an unrelated blog-generator toolkit sitting in the repo root that needs sorting out before this priority can even be scoped.
- **Priority 8 (off-page/backlinks): deliberately deferred**, non-technical/business-development work.
- **Priority 9 (ongoing monitoring): ongoing**, re-check Search Console indexation numbers periodically.

### Other completed work (outside the audit doc's own list)
- Permanently-closed-shop policy: shops Google marks `CLOSED_PERMANENTLY` are excluded from all listings but their own page still renders, with a visible "Permanently closed" notice. Applies automatically going forward via the monthly refresh.
- Two stray shops removed entirely (not just soft-removed): `bobatea` and `tbubbles-green` were tagged `city = 'Philadelphia'` but were actually in Altoona, PA and Uniontown, OH — genuine data errors, hard-deleted.
- Photo backfill: shops missing a working photo were backfilled from Google Places Photo API (324 fixed).
- Monthly automated refresh (`.github/workflows/monthly-shop-refresh.yml` + `scripts/monthly-refresh-shop-data.mjs`) keeps rating/review-count/business-status current across all 7 cities. **Not yet fully live** — see "Needs your attention" below.
- A pre-existing chain-location slug-collision bug (discovered mid-engagement, unrelated to the above) was already fixed back on 2026-08-24, before this most recent work — 133 previously-missing chain locations (Kung Fu Tea, Gong Cha, etc.) now have their own pages.

### NYC borough pages (Priority 5, phase 1) — real numbers
Borough is derived from ZIP code (`scripts/backfill-nyc-boroughs.mjs`), not Outscraper's own unreliable `borough` field. Of New York's 145 shops, 136 matched to one of the 5 boroughs:

| Borough | Real shop count | Status |
|---|---|---|
| Manhattan | 126 | **Live, indexed, linked from the NY city page** |
| Queens | 9 | Page exists, works, but noindexed + unlinked (below the 15-shop floor) |
| Brooklyn | 1 | Same - noindexed + unlinked |
| Bronx | 0 | Same - noindexed + unlinked, empty-state page |
| Staten Island | 0 | Same - noindexed + unlinked, empty-state page |

The floor is `MIN_BOROUGH_SHOP_COUNT = 15` in `src/utils/data.ts` - adjust there if real-world results suggest a different cutoff. Queens, Brooklyn, Bronx, and Staten Island will only become visible/indexed once a future data top-up grows their real counts past that line - which is exactly why Priority 5 phase 2 (below) matters for NYC too, not just for brand-new cities.

## Next up

**You asked for this as the very next deliverable, before anything else:** a recommendation on 3-5 candidate cities to add beyond the current 7 (with reasoning), plus an evaluation of whether each is better sourced via the existing Google Places API connection directly vs. having you run a fresh Outscraper pull for me to validate/enrich - and the reasoning for which approach fits which situation. This should also account for what NYC's own data gap just taught us (Outscraper's original NYC pull barely reached outside Manhattan), since that's a real, concrete data point for the same decision.

After that's delivered and any decisions from it are acted on, the standing reminder from earlier still applies: come back to **Priority 7 (blog)** and **Priority 8 (off-page/backlinks)** as their own separate phases.

## ⚠️ Needs your attention (not things I can resolve myself)

1. **GitHub Actions secrets missing.** `.github/workflows/monthly-shop-refresh.yml` needs `DATABASE_URL` and `GOOGLE_PLACES_API_KEY` added as repo secrets (GitHub web UI → Settings → Secrets) - I have no `gh` CLI access in this environment to check or set them. Until this is done, the monthly refresh won't actually run on schedule.
2. **Unrelated files in the repo root.** There's a `blog-info/` folder (`blog-generator-README.md`, `broadleaf-blog-briefs.md`, `generate-blog-post.mjs`) that is **not about DiscoverBoba or boba tea at all** - it's a blog-post generator and 17 content briefs for a business called "Broadleaf" (web design, targeting contractors/small businesses), posting to a `broadleafwebdesign.com` API. This looks like it landed in this repo by accident (wrong folder during a copy/unzip, most likely). It's currently untracked (not committed) - worth confirming whether it should be moved out of this repo entirely, or if it was intentional and I'm missing context. I have not touched, committed, or acted on anything in that folder.
3. **A handful of untracked CSV review files** in the repo root (`atlanta-google-refresh-review.csv`, `chicago-google-refresh-review.csv`, etc., plus `photo-backfill-applied.csv` / `photo-backfill-dry-run.csv`) are leftover human-review exports from earlier backfill runs, already acted on. Safe to delete whenever, or let me know if you want them gitignored so they stop showing up in `git status`.
4. **Search Console cross-referencing** (Priority 1's original task, now lower-stakes since the content itself is done, but still useful for Priority 9 monitoring): exporting the "Crawled/Discovered - currently not indexed" URL lists from GSC and watching indexation trend upward is something only you can pull from the dashboard.
5. **Vercel log verification** (Priority 6): confirming real AI-bot traffic (not just that they *can* access the site, which is already confirmed) needs a look at Vercel's Analytics/Logs tab.

## Where to look for detail
- `docs/discoverboba-seo-audit-plan-14sep2026.md` - the authoritative, kept-current priority checklist. Read this, not just this status doc, before starting new SEO work.
- `CLAUDE.md` - project guardrails (mostly scoped to the now-complete UI overhaul workstream, but still a useful reality-check before touching JSON-LD/metadata/routing).
- Recent git log (`git log --oneline -20`) for the literal sequence of what shipped when.
