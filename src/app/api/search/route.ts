import { NextRequest, NextResponse } from 'next/server'
import { getCities, getShopsByCity, Shop } from '@/utils/data'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.toLowerCase() || ''
  
  if (!query || query.length < 2) {
    return NextResponse.json({ shops: [] })
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
      const nameMatch = shop.name.toLowerCase().includes(query)
      const addressMatch = shop.formatted_address.toLowerCase().includes(query)
      const cityMatch = shop.city.toLowerCase().includes(query)
      const tagMatch = shop.tags.some(tag => tag.toLowerCase().includes(query))
      
      return nameMatch || addressMatch || cityMatch || tagMatch
    })
    
    // Sort by relevance (name matches first, then others)
    const sortedShops = filteredShops.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query) ? 1 : 0
      const bNameMatch = b.name.toLowerCase().includes(query) ? 1 : 0
      
      return bNameMatch - aNameMatch || b.rating - a.rating
    })
    
    // Limit to 20 results for performance
    const limitedShops = sortedShops.slice(0, 20)
    
    return NextResponse.json({ shops: limitedShops })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Failed to search shops' }, { status: 500 })
  }
}
