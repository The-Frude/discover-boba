# DiscoverBoba.com — Guardrails

This site is a live directory with ~813 shop pages across 7 cities that has recently had a full SEO/GEO pass: JSON-LD structured data, canonical tags, `metadataBase`, authored meta titles and descriptions on every shop, city intro copy, `llms.txt`, and AI-crawler allowances in `robots.ts`. Organic traffic is growing. **That earned equity is the thing most at risk during the UI overhaul in `docs/UI-OVERHAUL-PLAN-09sep2026.md`.**

## Non-negotiable guardrails (UI overhaul workstream)

1. **Do not remove or restructure JSON-LD.** Schema blocks (`LocalBusiness`/`CafeOrCoffeeShop`, `BreadcrumbList`, `FAQPage`, `ItemList`) stay on the same pages, with the same properties. If a component that emits schema is refactored, the emitted JSON must be byte-comparable except for whitespace.
2. **Do not change any `generateMetadata` / `metadata` export**, canonical URL, `metadataBase`, or Open Graph field values. Titles and descriptions were individually authored; they are content, not boilerplate.
3. **Do not change URL structure or route segments.** `/find-boba-shops/[city]` and all shop routes keep their exact paths. No new redirects.
4. **Do not convert server-rendered content to client-rendered content.** Shop names, addresses, descriptions, ratings, hours, and city copy must remain in the initial HTML payload. Interactive layers (map, filters) are progressive enhancements on top of already-rendered content.
5. **Preserve the heading outline.** One `h1` per page, and the existing `h2`/`h3` hierarchy of shop names and section headings stays semantically equivalent. Visual size changes are fine; demoting a shop name from `h2` to a `div` is not.
6. **Preserve every existing internal link.** Crawl paths between homepage → city → shop are load-bearing. Links may be restyled; they may not be removed, replaced with `onClick` handlers, or hidden behind interaction on any breakpoint.
7. **Do not touch `robots.ts`, `sitemap.ts`, `llms.txt`, or the Places API refresh scripts** in this workstream.
8. **No new heavy client dependencies without asking.** No component library (MUI, Chakra, Mantine), no animation library, no CSS-in-JS runtime. Tailwind + a small number of headless primitives only.
9. **Branch per phase.** `ui/phase-N-<name>`, deployed to a Vercel preview, verified, then merged. Never commit directly to `main` in this workstream.

## Anti-generic guardrails

The goal is a site that looks designed for boba, not a site that looks AI-generated. Avoid:

- Identical border-radius on every element regardless of hierarchy.
- The same soft grey `rgba(0,0,0,0.1)` shadow under every card.
- Hover-lift on every card plus fade-and-slide-up on every section.
- Tracked-out ALL-CAPS eyebrow labels above headings.
- Meta strings joined with middle dots (`Open · $$ · 4.6`).
- A `→` appended to button and link text.
- Gradient washes used as decoration in more than one place.

Boldness is spent in exactly two places: the pearl rating badge and the hero. Everything else stays quiet and disciplined.

## Decisions already made — do not revisit

- **No new map work in this cycle.** No split-screen map on city pages, no maps anywhere they don't already exist. (Phase 6 originally planned to remove the existing city-page map entirely; owner reversed that 2026-09-09 - it stays, unobtrusive, near the bottom, lazy-loaded. See the Phase 6 section of the plan.)
- **No save/bookmark feature.**
- **No "verified" badges.** Real provenance ("Rating and hours from Google, last checked [date]") replaces trust theater.

## Process

Full plan: `docs/UI-OVERHAUL-PLAN-09sep2026.md`. Work one phase at a time; each has a kickoff prompt, a definition of done, and a verification gate that must pass before the next phase starts. Each phase is one branch and one squashed merge commit — never batch multiple phases into one merge.
