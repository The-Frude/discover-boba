import { NextRequest, NextResponse } from 'next/server'
import { getCities, getShopsByCity } from '@/utils/data'

// GET /api/shops - Get all shops
export async function GET(request: NextRequest) {
  try {
    const cities = await getCities()
    const allShops = []
    
    for (const city of cities) {
      const shops = await getShopsByCity(city.name)
      allShops.push(...shops)
    }
    
    // Return a simplified version of the shops with just the essential info
    const simplifiedShops = allShops.map(shop => ({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      city: shop.city,
      state: shop.state,
    }))
    
    return NextResponse.json(simplifiedShops)
  } catch (error) {
    console.error('Error getting shops:', error)
    return NextResponse.json(
      { error: 'Failed to get shops' },
      { status: 500 }
    )
  }
}
