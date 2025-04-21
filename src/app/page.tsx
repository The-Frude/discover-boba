import Link from 'next/link'
import { getCities } from '@/utils/data'
import OptimizedImage from '@/components/OptimizedImage'

export default async function Home() {
  const cities = await getCities()

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/header-holder.jpg"
            alt="Boba Tea Background"
            fill
            priority
            className="object-cover brightness-50"
            sizes="100vw"
          />
        </div>
        <div className="container-custom relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Discover the Best Boba Tea Shops
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Find your perfect bubble tea experience in cities across the United States
          </p>
          
          {/* Search Bar */}
          <form 
            action="/search" 
            method="get"
            className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-lg p-2 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                name="q"
                placeholder="Search for boba shops..."
                className="flex-grow px-4 py-3 rounded-md bg-white/90 text-gray-800 focus:outline-none"
                required
                minLength={2}
              />
              <button type="submit" className="btn-primary">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Featured Cities */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Explore Boba Shops by City
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cities.map((city) => (
              <Link 
                key={city.name} 
                href={`/find-boba-shops/${city.slug}`}
                className="card group"
              >
                <div className="h-48 relative overflow-hidden">
                  <OptimizedImage
                    src={city.image || "/images/boba-cat.jpeg"}
                    alt={`${city.name} Boba Shops`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{city.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {city.shopCount} Boba Shops
                  </p>
                  <span className="text-primary-600 dark:text-primary-400 font-medium flex items-center">
                    Explore Shops
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Boba Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4">What is Boba Tea?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Boba tea, also known as bubble tea, is a Taiwanese drink that combines tea with milk, fruit, and chewy tapioca pearls that sit at the bottom of the cup.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Since its creation in the 1980s, boba tea has become a global phenomenon with countless flavors and variations to explore.
              </p>
              <Link href="/faq" className="btn-primary inline-block">
                Learn More
              </Link>
            </div>
            <div className="md:w-1/2 relative h-[300px] md:h-[400px] w-full">
              <OptimizedImage
                src="/images/boba-cat.jpeg"
                alt="Boba Tea Varieties"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
