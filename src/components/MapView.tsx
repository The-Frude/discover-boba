'use client'

import { useEffect, useRef } from 'react'

interface MapViewProps {
  address: string
  name: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function MapView({ address, name }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  
  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMapsScript = () => {
      if (typeof window.google === 'undefined') {
        // Use the environment variable for the API key
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`
        script.async = true
        script.defer = true
        document.head.appendChild(script)
        
        // Define the callback function
        window.initMap = () => {
          initializeMap()
        }
        
        return () => {
          // Clean up
          window.initMap = () => {}
          document.head.removeChild(script)
        }
      } else {
        // Google Maps already loaded
        initializeMap()
      }
    }
    
    // Initialize the map
    const initializeMap = () => {
      if (!mapRef.current || typeof window.google === 'undefined') return
      
      // For demonstration purposes, we'll use a geocoding service
      // In a real application, you would store and use the actual coordinates
      const geocoder = new window.google.maps.Geocoder()
      
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const position = results[0].geometry.location
          
          const mapOptions = {
            center: position,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }
          
          // Create the map
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions)
          
          // Add a marker
          new window.google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: name,
            animation: window.google.maps.Animation.DROP,
          })
        } else {
          console.error('Geocode was not successful for the following reason:', status)
          
          // Display a fallback message in the map container
          if (mapRef.current) {
            mapRef.current.innerHTML = `
              <div class="flex items-center justify-center h-full">
                <p class="text-gray-500 dark:text-gray-400">
                  Unable to load map for this location
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
  }, [address, name])
  
  return (
    <div 
      ref={mapRef} 
      className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg"
    >
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">
          Loading map...
        </p>
      </div>
    </div>
  )
}
