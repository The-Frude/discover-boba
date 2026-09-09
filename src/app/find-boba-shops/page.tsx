import { Metadata } from 'next'
import Link from 'next/link'
import { getCities } from '@/utils/data'
import OptimizedImage from '@/components/OptimizedImage'
import ShopTile from '@/components/ShopTile'

export const metadata: Metadata = {
  title: 'Find Boba Tea Shops in Major Cities | Discover Boba',
  description: 'Browse our directory of boba tea shops in major cities across the United States. Find the perfect bubble tea spot near you.',
  keywords: 'boba, bubble tea, find boba shops, boba near me, bubble tea shops, milk tea, tapioca, pearls',
  alternates: {
    canonical: '/find-boba-shops',
  },
}

export default async function FindShopsPage() {
  const cities = await getCities()
  
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/header-holder.jpg"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </div>
        <div className="container-custom relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Boba Tea Shops
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Discover the best bubble tea shops in cities across the United States
          </p>
        </div>
      </section>

      {/* Cities Grid */}
      <section className="py-16" style={{ background: 'var(--bg)' }}>
        <div className="container-custom">
          <h2
            className="text-3xl mb-8 text-center"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--ink)' }}
          >
            Browse by City
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <Link
                key={city.name}
                href={`/find-boba-shops/${city.slug}`}
                className="group relative rounded-card overflow-hidden transition-colors duration-motion ease-motion hover:border-[var(--matcha-deep)] border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--taro-deep)]"
                style={{ background: 'var(--surface)', borderColor: 'var(--rule)' }}
              >
                <ShopTile
                  id={city.slug}
                  imageUrl={null}
                  alt=""
                  aspectClassName="aspect-[16/9]"
                  className="transition-transform duration-motion ease-motion group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none"
                />
                <div className="p-6">
                  <h3 className="text-xl mb-1" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--ink)' }}>
                    {city.name}, {city.state}
                  </h3>
                  <p style={{ color: 'var(--ink-muted)' }}>{city.shopCount} boba shops</p>
                </div>
              </Link>
            ))}
          </div>

          {cities.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No cities found</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Please check back later as we add more cities to our database.
              </p>
            </div>
          )}
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container-custom">
          <div className="bg-primary-50 dark:bg-primary-900 rounded-lg p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-800 dark:text-primary-100">
              Don't see your city?
            </h2>
            <p className="text-primary-700 dark:text-primary-200 mb-6 max-w-2xl mx-auto">
              We're constantly adding new cities to our database. Check back soon or let us know which city you'd like to see added next!
            </p>
            <Link href="/faq" className="btn-primary">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
