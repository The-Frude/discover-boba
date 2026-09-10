import Link from 'next/link'
import { getCities } from '@/utils/data'
import ShopTile from '@/components/ShopTile'
import JsonLd from '@/components/JsonLd'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Discover Boba',
  url: 'https://www.discoverboba.com',
  description: 'A directory of boba tea shops across major U.S. cities.',
}

// Same six palettes as ShopTile - a homepage hero built from soft blooms of
// each drink color over a dark base, rather than a stock photo. This and
// the pearl rating badge are the only two places the design spends bold
// color (docs/UI-OVERHAUL-PLAN-09sep2026.md).
const HERO_GRADIENT = [
  'radial-gradient(at 12% 15%, #4F7A3466 0, transparent 45%)',
  'radial-gradient(at 88% 12%, #7B5CA666 0, transparent 45%)',
  'radial-gradient(at 15% 88%, #7A4A1F66 0, transparent 45%)',
  'radial-gradient(at 85% 85%, #C24A6766 0, transparent 45%)',
  'radial-gradient(at 50% 50%, #C0562155 0, transparent 55%)',
  'radial-gradient(at 60% 95%, #B88A1E55 0, transparent 45%)',
  'linear-gradient(160deg, #1E293B 0%, #14202E 100%)',
].join(', ')

// Real Q&A content, same wording as before - just restructured as
// accordions instead of static text blocks, with a genuine FAQPage schema
// added since it's now real, visible question/answer content (didn't exist
// as schema before; nothing removed from the protected /faq page's own
// FAQPage block per CLAUDE.md guardrail #1).
const HOME_FAQS = [
  {
    question: 'What is Boba Tea?',
    answer:
      'Boba tea, also lovingly called bubble tea, is a delightfully sweet and chewy Taiwanese tea-based drink. Imagine a refreshing mix of tea, milk (or dairy-free alternatives!), sweeteners, and those wonderfully squishy tapioca pearls - the "boba" or "bubbles." Plus you\'ll find endless variations, from fruity flavors like mango and strawberry to richer options like taro and brown sugar.',
  },
  {
    question: 'Why is boba tea so popular?',
    answer:
      "It's more than just a drink; it's an experience! The combination of flavors and textures is unique and satisfying. Plus, it's customizable to your taste - you can adjust the sweetness, ice level, and toppings.",
  },
  {
    question: 'Looking for the best boba tea near you?',
    answer:
      "You've come to the right place! Our directory helps you discover top-rated boba shops in your city, so you can easily find your next favorite bubble tea fix. Explore menus, read reviews, and find the perfect spot to satisfy your boba cravings. Start your search today and unlock a world of delicious boba possibilities!",
  },
]

const homeFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: HOME_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default async function Home() {
  const cities = await getCities()
  const totalShops = cities.reduce((sum, city) => sum + city.shopCount, 0)

  return (
    <main className="min-h-screen">
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={homeFaqJsonLd} />

      {/* Hero - video background, with a CSS-gradient fallback layer
          underneath for prefers-reduced-motion users (video is hidden via
          motion-reduce:hidden rather than skipped entirely, so there's no
          flash of missing content either way). */}
      <section className="relative flex items-center justify-center py-20 md:py-32 overflow-hidden" style={{ background: HERO_GRADIENT }}>
        <video
          className="absolute inset-0 w-full h-full object-cover motion-reduce:hidden"
          src="/videos/boba-shop-mall-compressed.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div
          className="relative z-10 mx-4 sm:mx-auto max-w-2xl text-center text-white rounded-card p-8 md:p-12"
          style={{
            background: 'rgba(20,32,46,0.32)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          <h1
            className="text-4xl md:text-6xl mb-4"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '-0.02em', textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}
          >
            Find the best boba in your city
          </h1>
          <p className="text-xl md:text-2xl mb-8" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
            {totalShops}+ shops across {cities.length} cities, checked and rated
          </p>

          <form
            action="/search"
            method="get"
            className="rounded-control p-2 shadow-lg"
            style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)' }}
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="home-hero-search" className="sr-only">
                Search for boba shops
              </label>
              <input
                id="home-hero-search"
                type="text"
                name="q"
                placeholder="Search for boba shops..."
                className="flex-grow px-4 py-4 rounded-control text-lg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
                style={{ background: '#FFFFFF', color: 'var(--ink)' }}
                required
                minLength={2}
              />
              <button
                type="submit"
                className="px-6 py-4 rounded-control text-lg font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
                style={{ background: 'var(--matcha-deep)' }}
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* City section */}
      <section className="py-16" style={{ background: 'var(--bg)' }}>
        <div className="container-custom">
          <h2
            className="text-3xl mb-8 text-center"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--ink)' }}
          >
            Explore Boba Shops by City
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <Link
                key={city.name}
                href={`/find-boba-shops/${city.slug}`}
                className="group relative rounded-card overflow-hidden transition-colors duration-motion ease-motion hover:border-[var(--matcha-deep)] border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
                style={{ background: 'var(--surface)', borderColor: 'var(--rule)' }}
              >
                {/* Real city photo - ShopTile still supplies the generated
                    fallback tile automatically for any city without one. */}
                <ShopTile
                  id={city.slug}
                  imageUrl={city.image}
                  alt={`${city.name} skyline`}
                  aspectClassName="aspect-[16/9]"
                  className="transition-transform duration-motion ease-motion group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none"
                />
                <div className="p-6">
                  <h3 className="text-xl mb-1" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--ink)' }}>
                    {city.name}
                  </h3>
                  <p style={{ color: 'var(--ink-muted)' }}>{city.shopCount} boba shops</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related reading slot (docs/UI-OVERHAUL-PLAN-09sep2026.md §10) -
          reserved for Phase 10 guides, between cities and FAQ. No guide
          content exists yet, so intentionally nothing renders here today. */}

      {/* FAQ */}
      <section className="py-16" style={{ background: 'var(--surface)' }}>
        <div className="container-custom max-w-3xl">
          <h2
            className="text-3xl mb-8 text-center"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--ink)' }}
          >
            About Boba Tea
          </h2>
          <div className="flex flex-col gap-3">
            {HOME_FAQS.map((faq) => (
              <details key={faq.question} className="rounded-card p-5" style={{ border: '1px solid var(--rule)' }}>
                <summary
                  className="cursor-pointer text-lg [&::-webkit-details-marker]:hidden"
                  style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--ink)' }}
                >
                  {faq.question}
                </summary>
                {/* Answer stays in the DOM when collapsed (native <details>
                    hides it visually, doesn't remove it), so it's still in
                    the HTML payload for search and AI crawlers and the
                    FAQPage schema above stays truthful. */}
                <p className="mt-3" style={{ color: 'var(--ink-muted)' }}>{faq.answer}</p>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="btn-primary inline-block">
              More Boba Tea Questions
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
