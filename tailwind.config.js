/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // UI overhaul tokens (docs/design-system.md) - additive, not yet
        // consumed by any component. `primary`/`secondary` below are the
        // pre-overhaul tokens and stay untouched until later phases migrate
        // components off them.
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
        },
        matcha: {
          DEFAULT: 'var(--matcha)',
          deep: 'var(--matcha-deep)',
        },
        taro: {
          DEFAULT: 'var(--taro)',
          deep: 'var(--taro-deep)',
        },
        rule: 'var(--rule)',
        'border-control': 'var(--border-control)',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        display: ['var(--font-poppins)'],
        // New heading font for the overhaul (Gabarito or its fallback chain
        // - see docs/design-system.md for which one actually loaded).
        // `display` above stays pointed at Poppins so no existing heading
        // changes font until a later phase repoints it.
        heading: ['var(--font-heading)'],
      },
      borderRadius: {
        card: 'var(--r-card)',
        media: 'var(--r-media)',
        control: 'var(--r-control)',
        pill: 'var(--r-pill)',
      },
      boxShadow: {
        raised: 'var(--e-raised-shadow)',
      },
      // Named, not DEFAULT - `.btn-primary`/`.btn-secondary` currently use
      // bare `transition-all` with no explicit duration/easing class, so
      // they rely on Tailwind's own defaults. Overriding DEFAULT here would
      // silently change their live hover-transition timing.
      transitionDuration: {
        motion: '160ms',
      },
      transitionTimingFunction: {
        motion: 'ease-out',
      },
    },
  },
  plugins: [],
}
