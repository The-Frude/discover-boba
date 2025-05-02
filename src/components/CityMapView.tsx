'use client'

import { useEffect, useRef, useState } from 'react'
import { Shop } from '@/utils/data'

interface CityMapViewProps {
  shops: Shop[]
  cityName: string
}

declare global {
  interface Window {
    google: any
    initCityMap?: () => void // Make optional as it's dynamically defined
    __googleMapsScriptLoading?: boolean // Flag to track script loading
  }
}

export default function CityMapView({ shops, cityName }: CityMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  
  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMapsScript = () => {
      // Check if script is already loading or loaded
      if (typeof window.google !== 'undefined') {
        initializeMap()
        return () => {} // No cleanup needed if already loaded
      }
      
      if (window.__googleMapsScriptLoading) {
        // Script is already being loaded, wait for initCityMap callback
        return () => {} 
      }

      window.__googleMapsScriptLoading = true // Set flag
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
      const scriptId = 'google-maps-script'
      
      // Check if script tag already exists (e.g., from previous mount)
      if (document.getElementById(scriptId)) {
         // If script exists but google object isn't ready, rely on callback
         // If google object is ready, initializeMap will be called above
         return () => { window.__googleMapsScriptLoading = false }
      }

      const script = document.createElement('script')
      script.id = scriptId
      // Include 'marker' library for AdvancedMarkerElement
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initCityMap&libraries=marker`
      script.async = true
      script.defer = true
      
      // Define the callback function *before* appending script
      window.initCityMap = () => {
        console.log('Google Maps script loaded via callback.')
        window.__googleMapsScriptLoading = false // Reset flag
        initializeMap()
        // Clean up callback function from window scope after it executes
        delete window.initCityMap 
      }
      
      script.onerror = () => {
        console.error('Google Maps script failed to load.')
        window.__googleMapsScriptLoading = false // Reset flag on error
        // Optionally handle the error state in the UI
      }

      document.head.appendChild(script)

      // Return cleanup function
      return () => {
        const existingScript = document.getElementById(scriptId)
        if (existingScript && document.head.contains(existingScript)) {
          // Optional: remove script on unmount, but often better to leave it
          // document.head.removeChild(existingScript); 
        }
        // Clean up callback if component unmounts before script loads
        if (window.initCityMap) {
          delete window.initCityMap
        }
        // Reset loading flag if unmounted before load finishes
        // window.__googleMapsScriptLoading = false; // Be cautious with this
      }
    }
    
    // Initialize the map
    const initializeMap = async () => { // Make async for marker library
      if (!mapRef.current || typeof window.google === 'undefined' || !window.google.maps || shops.length === 0) {
        console.log('Map initialization prerequisites not met.');
        return;
      }
      
      // Ensure marker library is loaded
      const { Map } = await window.google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      const { Geocoder } = await window.google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
      const { LatLngBounds } = await window.google.maps.importLibrary("core") as google.maps.CoreLibrary;
      const { InfoWindow } = await window.google.maps.importLibrary("maps") as google.maps.MapsLibrary; // InfoWindow is part of maps library

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
            // Required for AdvancedMarkerElement
            mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID' 
          }
          
          // Create the map
          mapInstanceRef.current = new Map(mapRef.current!, mapOptions)
          
          // Create a single InfoWindow instance to reuse
          const infoWindow = new InfoWindow();

          // Add markers for each shop
          const bounds = new LatLngBounds()
          
          // Process shops in batches to avoid rate limiting
          const addShopMarkers = (index = 0) => {
            if (index >= shops.length) {
              // All shops processed, adjust bounds
              if (shops.length > 1 && bounds.getNorthEast() && bounds.getSouthWest()) {
                 // Check if bounds are valid before fitting
                 if (!bounds.getNorthEast().equals(bounds.getSouthWest())) {
                    mapInstanceRef.current.fitBounds(bounds);
                 } else if (shops.length === 1) {
                    // If only one shop, center on it
                    mapInstanceRef.current.setCenter(bounds.getCenter());
                    mapInstanceRef.current.setZoom(15); // Adjust zoom level as needed
                 }
              }
              return
            }
            
            const shop = shops[index]
            
            // Geocode the shop address
            geocoder.geocode({ address: shop.formatted_address }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                const position = results[0].geometry.location
                
                // Create content for the InfoWindow
                const infoWindowContent = document.createElement('div');
                infoWindowContent.className = 'p-2';
                infoWindowContent.innerHTML = `
                  <h3 class="font-bold">${shop.name}</h3>
                  <p class="text-sm">${shop.formatted_address}</p>
                  <p class="text-sm mt-1">Rating: ${shop.rating ? shop.rating.toFixed(1) : 'N/A'} (${shop.user_ratings_total || 0} reviews)</p>
                  <a href="/boba-shop/${shop.slug}" class="text-blue-600 hover:underline text-sm block mt-2">View Details</a>
                `;

                // Add an Advanced Marker
                const marker = new AdvancedMarkerElement({
                  position,
                  map: mapInstanceRef.current,
                  title: shop.name,
                  // Optional: customize appearance
                  // content: buildContent(shop), 
                });

                // Add click listener to the marker
                marker.addListener('click', () => {
                  infoWindow.close(); // Close existing window
                  infoWindow.setContent(infoWindowContent);
                  infoWindow.open(mapInstanceRef.current, marker);
                });
                
                // Extend bounds to include this marker
                bounds.extend(position)
              } else {
                 console.warn(`Geocode failed for ${shop.name} (${shop.formatted_address}): ${status}`);
              }
              
              // Process next shop after a small delay to avoid rate limiting
              setTimeout(() => addShopMarkers(index + 1), 150) // Slightly reduced delay
            })
          }
          
          // Start adding markers
          addShopMarkers()
        } else {
          console.error(`Geocode was not successful for city "${cityName}" for the following reason:`, status)
          
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
