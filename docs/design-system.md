# Design System — Phase 1

**Status:** tokens defined, consumed by nothing yet. Zero visual change to any live page. Visual review at `/dev/tokens` (noindex, not in sitemap).

Source of truth for values/rationale: `docs/UI-OVERHAUL-PLAN-09sep2026.md` §2. This document is the practical reference — where each token lives, its value, and how to consume it once a later phase starts building components against it.

---

## Where tokens live

- **CSS custom properties:** `src/styles/globals.css`, in `:root` (color/radius/elevation/motion/focus) and under `@layer components` (`.prose`).
- **Tailwind mapping:** `tailwind.config.js`, `theme.extend` — all additive. Nothing existing (`primary`, `secondary`, `fontFamily.sans`, `fontFamily.display`) was changed or removed.
- **Fonts:** `src/app/layout.tsx` — Gabarito loaded via `next/font/google` as `--font-heading`, alongside (not replacing) the existing Inter/Poppins loading.

**Gabarito loaded successfully** — no fallback to Familjen Grotesk or Schibsted Grotesk was needed; it's available in the installed `next/font/google` version.

## Why nothing looks different yet

`h1, h2, h3 { @apply font-display; }` in `globals.css` still points at Poppins (`--font-poppins`), and every existing component (`.btn-primary`, `.btn-secondary`, `.card`, `.tag`, `Header.tsx`'s wordmark) still uses the pre-overhaul `primary`/`secondary` color tokens. The new tokens exist in parallel under new names (`ink`, `matcha`, `taro`, `heading`, etc.) and nothing references them outside `/dev/tokens`. A later phase repoints `font-display` → `font-heading` and migrates components off `primary`/`secondary` — that's a deliberate, visible change for its own phase and commit, not something to sneak in here.

---

## Color

| Token (CSS var) | Tailwind utility | Hex | Contrast on `#FDFBF7` | Use |
|---|---|---|---|---|
| `--bg` | `bg-bg` | `#FDFBF7` | — | Page background (warm, not hospital white) |
| `--surface` | `bg-surface` | `#FFFFFF` | — | Cards, sheets, sticky bars |
| `--ink` | `text-ink` | `#1E293B` | 14.15:1 | Primary text, shop names |
| `--ink-muted` | `text-ink-muted` | `#64748B` | 4.60:1 | Addresses, hours, secondary meta |
| `--matcha` | `bg-matcha` / `text-matcha` | `#8CB369` | 2.32:1 | **Decorative only** — fails AA for text |
| `--matcha-deep` | `bg-matcha-deep` / `text-matcha-deep` | `#4F7A34` | 4.88:1 | Primary buttons, links, active filter state |
| `--taro` | `bg-taro` / `text-taro` | `#9B7EBD` | 3.32:1 | **Decorative only** — fails AA for text |
| `--taro-deep` | `bg-taro-deep` / `text-taro-deep` | `#7B5CA6` | 5.18:1 | Pearl rating badge, accent text |
| `--rule` | `border-rule` | `#E7E2D8` | 1.25:1 | Decorative hairlines only |
| `--border-control` | `border-border-control` | `#8F8677` | 3.48:1 | Borders on inputs/buttons/focusable controls (meets 3:1 non-text minimum) |

Rule: matcha is the action color, taro is the rating/accent color — they never compete in the same element. No third accent color. `primary`/`secondary` (blue/magenta) remain in `tailwind.config.js` for now; removing them is a later-phase cleanup once nothing references them.

## Typography

- **Headings:** Gabarito, weights 600/700, via `font-heading` (new) / `var(--font-heading)`.
- **Body/UI:** Inter, weights 400/500/600, via the existing `font-sans` / `var(--font-inter)`.

| Step | Size / line-height / tracking | Weight | Font | Use |
|---|---|---|---|---|
| display | 3rem / 1.05 / -0.02em | Gabarito 700 | heading | Hero only |
| h1 | 2.25rem / 1.15 / -0.015em | Gabarito 700 | heading | |
| h2 | 1.75rem / 1.2 / -0.01em | Gabarito 600 | heading | |
| h3 | 1.375rem / 1.3 / -0.005em | Gabarito 600 | heading | |
| body-lg | 1.0625rem / 1.65 | Inter 400 | sans | Intro copy, descriptions |
| body | 1rem / 1.6 | Inter 400 | sans | |
| small | 0.875rem / 1.5 | Inter 400 | sans | Meta, addresses |
| label | 0.8125rem / 1.4 / 0.005em | Inter 600 | sans | Filter labels, badges — sentence case, never all-caps |

Scale down one step below `768px`. Body copy blocks cap at `68ch` (`.prose` enforces this; apply `max-w-[68ch]` directly for non-prose blocks).

### `.prose` scope

Hand-defined in `globals.css` (`@tailwindcss/typography` is not installed — confirmed in `docs/AUDIT.md`). Covers paragraph rhythm at body-lg, `h2`/`h3` within prose, `ul`/`ol`, `blockquote`, inline links (underlined, `--matcha-deep`), `figure`/`figcaption`, and a full-width image at `--r-media`. Demonstrated with a ~440-word sample on `/dev/tokens`. This is what article bodies (§10 of the plan) will use once they exist — nothing consumes it yet.

## Space

4px base scale. **No custom Tailwind config was added** — Tailwind's default spacing scale already lines up exactly:

| px | Tailwind |
|---|---|
| 4 | `1` (e.g. `p-1`, `gap-1`) |
| 8 | `2` |
| 12 | `3` |
| 16 | `4` |
| 24 | `6` |
| 32 | `8` |
| 48 | `12` |
| 64 | `16` |
| 96 | `24` |

## Radius

Varied deliberately by role — never one radius for everything.

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--r-card` | 14px | `rounded-card` | Cards |
| `--r-media` | 10px | `rounded-media` | Images/tiles |
| `--r-control` | 10px | `rounded-control` | Buttons, inputs |
| `--r-pill` | 999px | `rounded-pill` | Pills, badges |

## Elevation

Two levels only.

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--e-rest-border` | `1px solid var(--rule)` | apply as `border` + `border-rule` | Default card state — cards sit on the page, they don't float |
| `--e-raised-shadow` | `0 6px 24px -8px rgba(30,41,59,0.18)` | `shadow-raised` | Sticky header on scroll, open dropdowns, mobile filter sheet — nothing else |

## Motion

| Token | Value | Tailwind | Note |
|---|---|---|---|
| `--motion-duration` | 160ms | `duration-motion` | Named, not `DEFAULT` — see below |
| `--motion-easing` | ease-out | `ease-motion` | Named, not `DEFAULT` — see below |

**Why named tokens, not Tailwind's `DEFAULT`:** `.btn-primary` and `.btn-secondary` already use bare `transition-all` with no explicit duration/easing class, so they rely on Tailwind's own defaults (150ms, a cubic-bezier ease). Overriding `transitionDuration.DEFAULT`/`transitionTimingFunction.DEFAULT` would have silently changed those two buttons' live hover-transition timing on every page that renders them — a real violation of "zero visual change." `duration-motion`/`ease-motion` are net-new utility classes instead.

Card interaction spec (for whichever phase rebuilds the card): border → `--matcha-deep`, media scales `1.02`, both via `duration-motion ease-motion`. No translate, no shadow change. Wrap in `motion-reduce:transition-none` (demonstrated on `/dev/tokens`). One orchestrated page-load moment, homepage hero only — not built in Phase 1.

## Focus and accessibility floor

| Token | Value |
|---|---|
| `--focus-ring` | `2px solid var(--taro-deep)` |
| `--focus-ring-offset` | `2px` |

Applied via Tailwind: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]`. **Not applied as a global `:focus-visible` default in this phase** — doing so would change the focus appearance of every existing interactive element on every live page. Demonstrated on `/dev/tokens`; components adopt it explicitly as they're rebuilt.

Floor for later phases: hit targets ≥44×44px on touch, every icon-only control gets `aria-label`, status is never color-only ("Open now" = dot **and** words).

---

## Verification

- `npm run build`: clean, no new warnings.
- `.next` output confirms zero change to any existing route's rendering strategy (`/find-boba-shops/[city]` and `/boba-shop/[slug]` caching behavior unaffected by this phase).
- Direct diff of the rendered homepage (`class="..."` attributes) between this branch and live production: **identical**, except one added (non-rendering) font-variable class on `<body>` from the new Gabarito font load.
- `/dev/tokens`: renders, `noindex, nofollow` confirmed in the response, not present in `sitemap.xml`.
- A pre-existing local-vs-production font-preload discrepancy (production emits `<link rel="preload" as="font">` tags, local `next build && next start` emits none) was investigated and confirmed present on unmodified `main` too — not introduced by this phase.
