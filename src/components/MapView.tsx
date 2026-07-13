'use client'

import { useEffect, useRef } from 'react'

interface MapViewProps {
  address: string
  name: string
  latitude?: number
  longitude?: number
}

declare global {
  interface Window {
    google: any
    initMap?: () => void // Make optional as it's dynamically defined
    __googleMapsScriptLoading?: boolean // Flag to track script loading
  }
}

export default function MapView({ address, name, latitude, longitude }: MapViewProps) {
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
        // Script is already being loaded, wait for callback
        const checkGoogleMaps = setInterval(() => {
          if (typeof window.google !== 'undefined') {
            clearInterval(checkGoogleMaps)
            initializeMap()
          }
        }, 100)

        return () => {
          clearInterval(checkGoogleMaps)
        }
      }

      window.__googleMapsScriptLoading = true // Set flag
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
      const scriptId = 'google-maps-script'

      // Check if script tag already exists (e.g., from previous mount)
      if (document.getElementById(scriptId)) {
         // If script exists but google object isn't ready, rely on callback
         return () => { window.__googleMapsScriptLoading = false }
      }

      const script = document.createElement('script')
      script.id = scriptId
      // Include 'marker' library for AdvancedMarkerElement
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=marker`
      script.async = true
      script.defer = true

      // Define the callback function *before* appending script
      window.initMap = () => {
        console.log('Google Maps script loaded via callback.')
        window.__googleMapsScriptLoading = false // Reset flag
        initializeMap()
        // Clean up callback function from window scope after it executes
        delete window.initMap
      }

      script.onerror = () => {
        console.error('Google Maps script failed to load.')
        window.__googleMapsScriptLoading = false // Reset flag on error
      }

      document.head.appendChild(script)

      // Return cleanup function
      return () => {
        // Clean up callback if component unmounts before script loads
        if (window.initMap) {
          delete window.initMap
        }
      }
    }

    // Renders the map once a position is known, whether it came directly
    // from stored coordinates or from geocoding the address.
    const renderMap = (position: any, Map: any, AdvancedMarkerElement: any) => {
      const mapOptions = {
        center: position,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID' // Required for AdvancedMarkerElement
      }

      mapInstanceRef.current = new Map(mapRef.current!, mapOptions)

      new AdvancedMarkerElement({
        position,
        map: mapInstanceRef.current,
        title: name,
      });
    }

    const showError = (message: string) => {
      console.error(message)
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

    // Initialize the map
    const initializeMap = async () => {
      if (!mapRef.current || typeof window.google === 'undefined' || !window.google.maps) {
        console.log('Map initialization prerequisites not met.');
        return;
      }

      try {
        const { Map } = await window.google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        // Prefer stored coordinates - skips a geocoding call entirely.
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          renderMap({ lat: latitude, lng: longitude }, Map, AdvancedMarkerElement)
          return
        }

        // Fallback for shops without stored coordinates yet.
        const { Geocoder } = await window.google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
        const geocoder = new Geocoder();

        geocoder.geocode({ address }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            renderMap(results[0].geometry.location, Map, AdvancedMarkerElement)
          } else {
            showError(`Geocode was not successful for "${address}": ${status}`)
          }
        })
      } catch (error) {
        showError(`Error initializing map: ${error}`)
      }
    }

    loadGoogleMapsScript()

    // Clean up
    return () => {
      if (mapInstanceRef.current) {
        // Clean up map instance if needed
      }
    }
  }, [address, name, latitude, longitude])

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
