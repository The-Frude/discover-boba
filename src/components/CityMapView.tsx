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
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  // The map shows every filtered shop regardless of which pagination page
  // is active, so a page click alone shouldn't cause a new Google Maps API
  // load - only the actual shop set (from a filter/sort change) should.
  const renderedSignatureRef = useRef<string>('')
  const [isVisible, setIsVisible] = useState(false)

  // Lazy-load: most visitors never scroll this far, so don't touch the
  // Google Maps API - script load or map load - until the section is
  // actually about to enter the viewport.
  useEffect(() => {
    if (isVisible || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const signature = shops.map((shop) => shop.id).sort().join(',')
    if (signature === renderedSignatureRef.current) {
      // Same shop set already rendered (e.g. only pagination changed) -
      // skip touching the API again.
      return
    }
    renderedSignatureRef.current = signature

    const loadGoogleMapsScript = () => {
      if (typeof window.google !== 'undefined') {
        plotShops()
        return
      }

      if (window.__googleMapsScriptLoading) {
        return
      }

      window.__googleMapsScriptLoading = true
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
      const scriptId = 'google-maps-script'

      if (document.getElementById(scriptId)) {
        return
      }

      const script = document.createElement('script')
      script.id = scriptId
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initCityMap&libraries=marker`
      script.async = true
      script.defer = true

      window.initCityMap = () => {
        window.__googleMapsScriptLoading = false
        plotShops()
        delete window.initCityMap
      }

      script.onerror = () => {
        console.error('Google Maps script failed to load.')
        window.__googleMapsScriptLoading = false
      }

      document.head.appendChild(script)
    }

    // Creates the map at most once per page view (the one billable "map
    // load"); subsequent shop-set changes (filters/sort) just replace the
    // markers on the existing map instance instead of recreating it.
    const plotShops = async () => {
      if (!mapRef.current || typeof window.google === 'undefined' || !window.google.maps) {
        return
      }

      const { Map } = await window.google.maps.importLibrary('maps') as google.maps.MapsLibrary
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker') as google.maps.MarkerLibrary
      const { LatLngBounds } = await window.google.maps.importLibrary('core') as google.maps.CoreLibrary

      const locatedShops = shops.filter(
        (shop) => typeof shop.latitude === 'number' && typeof shop.longitude === 'number'
      )

      if (locatedShops.length === 0) {
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full">
              <p class="text-gray-500 dark:text-gray-400">
                No shop locations available for ${cityName}
              </p>
            </div>
          `
        }
        return
      }

      const bounds = new LatLngBounds()
      locatedShops.forEach((shop) => {
        bounds.extend({ lat: shop.latitude as number, lng: shop.longitude as number })
      })

      if (!mapInstanceRef.current) {
        const mapOptions = {
          center: bounds.getCenter(),
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
        }
        mapInstanceRef.current = new Map(mapRef.current, mapOptions)
        const { InfoWindow } = await window.google.maps.importLibrary('maps') as google.maps.MapsLibrary
        infoWindowRef.current = new InfoWindow()
      }

      // Clear any markers from a previous shop set before replotting.
      markersRef.current.forEach((marker) => { marker.map = null })
      markersRef.current = []

      locatedShops.forEach((shop) => {
        const position = { lat: shop.latitude as number, lng: shop.longitude as number }

        const infoWindowContent = document.createElement('div')
        infoWindowContent.className = 'p-2'
        infoWindowContent.innerHTML = `
          <h3 class="font-bold">${shop.name}</h3>
          <p class="text-sm">${shop.formatted_address}</p>
          <p class="text-sm mt-1">Rating: ${shop.rating ? shop.rating.toFixed(1) : 'N/A'} (${shop.user_ratings_total || 0} reviews)</p>
          <a href="/boba-shop/${shop.slug}" class="text-blue-600 hover:underline text-sm block mt-2">View Details</a>
        `

        const marker = new AdvancedMarkerElement({
          position,
          map: mapInstanceRef.current,
          title: shop.name,
        })

        marker.addListener('click', () => {
          infoWindowRef.current.close()
          infoWindowRef.current.setContent(infoWindowContent)
          infoWindowRef.current.open(mapInstanceRef.current, marker)
        })

        markersRef.current.push(marker)
      })

      if (locatedShops.length > 1) {
        mapInstanceRef.current.fitBounds(bounds)
      } else {
        mapInstanceRef.current.setCenter(bounds.getCenter())
        mapInstanceRef.current.setZoom(15)
      }
    }

    loadGoogleMapsScript()
  }, [isVisible, shops, cityName])

  return (
    <div ref={containerRef}>
      <div
        ref={mapRef}
        className="w-full h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg"
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-700 dark:text-gray-300">
            Loading map...
          </p>
        </div>
      </div>
    </div>
  )
}
