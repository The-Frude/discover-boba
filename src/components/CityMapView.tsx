'use client'

import { useEffect, useRef } from 'react'
import { Shop } from '@/utils/data'

interface CityMapViewProps {
  shops: Shop[]
  cityName: string
}

declare global {
  interface Window {
    google: any
    initCityMap: () => void
  }
}

export default function CityMapView({ shops, cityName }: CityMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  
  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMapsScript = () => {
      if (typeof window.google === 'undefined') {
        // Use the environment variable for the API key
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initCityMap`
        script.async = true
        script.defer = true
        document.head.appendChild(script)
        
        // Define the callback function
        window.initCityMap = () => {
          initializeMap()
        }
        
        return () => {
          // Clean up
          window.initCityMap = () => {}
          document.head.removeChild(script)
        }
      } else {
        // Google Maps already loaded
        initializeMap()
      }
    }
    
    // Initialize the map
    const initializeMap = () => {
      if (!mapRef.current || typeof window.google === 'undefined' || shops.length === 0) return
      
      // For demonstration purposes, we'll use a geocoding service
      // In a real application, you would store and use the actual coordinates
      const geocoder = new window.google.maps.Geocoder()
      
      // Geocode the city name to center the map
      geocoder.geocode({ address: cityName }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const cityPosition = results[0].geometry.location
          
          const mapOptions = {
            center: cityPosition,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }
          
          // Create the map
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions)
          
          // Add markers for each shop
          const bounds = new window.google.maps.LatLngBounds()
          
          // Process shops in batches to avoid rate limiting
          const addShopMarkers = (index = 0) => {
            if (index >= shops.length) {
              // All shops processed, adjust bounds
              if (shops.length > 1) {
                mapInstanceRef.current.fitBounds(bounds)
              }
              return
            }
            
            const shop = shops[index]
            
            // Geocode the shop address
            geocoder.geocode({ address: shop.formatted_address }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                const position = results[0].geometry.location
                
                // Add a marker
                const marker = new window.google.maps.Marker({
                  position,
                  map: mapInstanceRef.current,
                  title: shop.name,
                  animation: window.google.maps.Animation.DROP,
                })
                
                // Add info window
                const infoWindow = new window.google.maps.InfoWindow({
                  content: `
                    <div class="p-2">
                      <h3 class="font-bold">${shop.name}</h3>
                      <p class="text-sm">${shop.formatted_address}</p>
                      <p class="text-sm mt-1">Rating: ${shop.rating.toFixed(1)} (${shop.user_ratings_total} reviews)</p>
                      <a href="/boba-shop/${shop.slug}" class="text-blue-600 hover:underline text-sm block mt-2">View Details</a>
                    </div>
                  `,
                })
                
                // Add click event to open info window
                marker.addListener('click', () => {
                  infoWindow.open(mapInstanceRef.current, marker)
                })
                
                // Extend bounds to include this marker
                bounds.extend(position)
              }
              
              // Process next shop after a small delay to avoid rate limiting
              setTimeout(() => addShopMarkers(index + 1), 200)
            })
          }
          
          // Start adding markers
          addShopMarkers()
        } else {
          console.error('Geocode was not successful for the following reason:', status)
          
          // Display a fallback message in the map container
          if (mapRef.current) {
            mapRef.current.innerHTML = `
              <div class="flex items-center justify-center h-full">
                <p class="text-gray-500 dark:text-gray-400">
                  Unable to load map for ${cityName}
                </p>
              </div>
            `
          }
        }
      })
    }
    
    loadGoogleMapsScript()
    
    // Clean up
    return () => {
      if (mapInstanceRef.current) {
        // Clean up map instance if needed
      }
    }
  }, [shops, cityName])
  
  return (
    <div 
      ref={mapRef} 
      className="w-full h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg"
    >
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">
          Loading map...
        </p>
      </div>
    </div>
  )
}
