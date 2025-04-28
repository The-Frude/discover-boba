import { NextRequest, NextResponse } from 'next/server'
import { captureException } from '@sentry/nextjs'
import { getCities, getShopsByCity, Shop } from '@/utils/data'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.toLowerCase() || ''
  
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Search query must be at least 2 characters' },
      { status: 400 }
    )
  }
  
    try {
    // Get all cities
    const cities = await getCities()
    console.log('Cities loaded:', cities.map(c => c.name))
    
    // Get all shops from all cities
    const allShops: Shop[] = []
    
    for (const city of cities) {
      const cityShops = await getShopsByCity(city.name)
      console.log(`Shops for ${city.name}:`, cityShops.length)
      allShops.push(...cityShops)
    }
    
    // Filter shops based on search query with null checks
    const filteredShops = allShops.filter(shop => {
      const nameMatch = shop.name?.toLowerCase().includes(query) || false
      const addressMatch = shop.formatted_address?.toLowerCase().includes(query) || false
      const cityMatch = shop.city?.toLowerCase().includes(query) || false
      const tagMatch = (shop.tags || []).some(tag => tag?.toLowerCase().includes(query))
      
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
    captureException(error)
    return NextResponse.json(
      { error: 'Failed to process search request' },
      { status: 500 }
    )
  }
}
