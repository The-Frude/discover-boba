import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCities, getShopsByCity, Shop } from '@/utils/data'
import ShopCard from '@/components/ShopCard'
import OptimizedImage from '@/components/OptimizedImage'

interface SearchPageProps {
  searchParams: {
    q?: string
  }
}

export const metadata: Metadata = {
  title: 'Search Boba Tea Shops | Discover Boba',
  description: 'Search for boba tea shops across major cities in the United States.',
  keywords: 'boba, bubble tea, search, find boba shops, boba near me',
}

async function searchShops(query: string): Promise<Shop[]> {
  if (!query || query.length < 2) {
    return []
  }
  
  try {
    // Get all cities
    const cities = await getCities()
    
    // Get all shops from all cities
    const allShops: Shop[] = []
    
    for (const city of cities) {
      const cityShops = await getShopsByCity(city.name)
      allShops.push(...cityShops)
    }
    
    // Filter shops based on search query
    const filteredShops = allShops.filter(shop => {
      const nameMatch = shop.name.toLowerCase().includes(query.toLowerCase())
      const addressMatch = shop.formatted_address.toLowerCase().includes(query.toLowerCase())
      const cityMatch = shop.city.toLowerCase().includes(query.toLowerCase())
      const tagMatch = shop.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      
      return nameMatch || addressMatch || cityMatch || tagMatch
    })
    
    // Sort by relevance (name matches first, then others)
    const sortedShops = filteredShops.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
      const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
      
      return bNameMatch - aNameMatch || b.rating - a.rating
    })
    
    return sortedShops
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = searchParams
  const query = q
  
  if (!query) {
    redirect('/')
  }
  
  const shops = await searchShops(query)
  
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[30vh] min-h-[200px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/header-holder.jpg"
            alt="Search Results"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </div>
        <div className="container-custom relative z-10 text-center text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Search Results for "{query}"
          </h1>
          <p className="text-lg mb-4 max-w-3xl mx-auto">
            Found {shops.length} boba shops matching your search
          </p>
        </div>
      </section>

      {/* Search Results */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          {shops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">No results found</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We couldn't find any boba shops matching "{query}". Try a different search term or browse by city.
              </p>
              <Link href="/find-boba-shops" className="btn-primary">
                Browse All Cities
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
