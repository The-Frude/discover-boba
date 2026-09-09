import Link from 'next/link'
import { getCities } from '@/utils/data'

export default async function NotFound() {
  const cities = await getCities()

  return (
    <main className="min-h-screen flex items-center py-16 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg w-full mx-auto text-center">
        <h1 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--ink)' }}>
          Page not found
        </h1>
        <p className="mb-8" style={{ color: 'var(--ink-muted)' }}>
          The page you're looking for doesn't exist or has moved. Try a search, or pick a city below.
        </p>

        <form action="/search" method="get" className="flex gap-2 mb-10">
          <label htmlFor="not-found-search" className="sr-only">
            Search for boba shops
          </label>
          <input
            id="not-found-search"
            type="text"
            name="q"
            placeholder="Search for boba shops..."
            required
            minLength={2}
            className="flex-grow px-4 py-3 rounded-control text-base focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
            style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--rule)' }}
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-control text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
            style={{ background: 'var(--matcha-deep)' }}
          >
            Search
          </button>
        </form>

        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>
          Or browse boba shops by city
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/find-boba-shops/${city.slug}`}
              className="text-sm font-medium px-3 py-2 rounded-pill transition-colors duration-motion ease-motion focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
              style={{ background: 'var(--surface)', border: '1px solid var(--rule)', color: 'var(--ink)' }}
            >
              {city.name}
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/" className="text-sm underline" style={{ color: 'var(--matcha-deep)' }}>
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  )
}
