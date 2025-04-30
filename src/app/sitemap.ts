import { MetadataRoute } from 'next'
import { getCities, getShopsByCity } from '@/utils/data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.discoverboba.com'
  
  // Get current date for dynamic content
  const currentDate = new Date()
  
  // Use specific dates for static content
  // These dates should be updated whenever the respective pages are modified
  const homeLastModified = new Date('2025-04-29')
  const faqLastModified = new Date('2025-04-15')
  const contactLastModified = new Date('2025-04-10')
  const searchLastModified = new Date('2025-04-20')
  
  // Base routes
  const routes = [
    {
      url: baseUrl,
      lastModified: homeLastModified,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: faqLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/find-boba-shops`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: contactLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: searchLastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(), // Use current date for now
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ]
  
  // Get all cities
  const cities = await getCities()
  
  // Add city pages
  const cityRoutes = cities.map(city => ({
    url: `${baseUrl}/find-boba-shops/${city.slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  
  // Get all shops for each city
  const shopRoutes = []
  
  for (const city of cities) {
    const shops = await getShopsByCity(city.name)
    
    const cityShopRoutes = shops.map(shop => ({
      url: `${baseUrl}/boba-shop/${shop.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
    
    shopRoutes.push(...cityShopRoutes)
  }
  
  return [...routes, ...cityRoutes, ...shopRoutes]
}
