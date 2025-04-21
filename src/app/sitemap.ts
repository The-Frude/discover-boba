import { MetadataRoute } from 'next'
import { getCities, getShopsByCity } from '@/utils/data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://discover-boba.example.com'
  
  // Base routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/find-boba-shops`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ]
  
  // Get all cities
  const cities = await getCities()
  
  // Add city pages
  const cityRoutes = cities.map(city => ({
    url: `${baseUrl}/find-boba-shops/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))
  
  // Get all shops for each city
  const shopRoutes = []
  
  for (const city of cities) {
    const shops = await getShopsByCity(city.name)
    
    const cityShopRoutes = shops.map(shop => ({
      url: `${baseUrl}/boba-shop/${shop.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
    
    shopRoutes.push(...cityShopRoutes)
  }
  
  return [...routes, ...cityRoutes, ...shopRoutes]
}
