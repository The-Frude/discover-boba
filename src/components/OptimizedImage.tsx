'use client'

import { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'

// Define the props for OptimizedImage, extending ImageProps but omitting 'src'
// and adding our custom props like lowQualitySrc
interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string
  lowQualitySrc?: string
  alt: string
  // sizes is optional, but we provide a default if fill is true
  sizes?: string
}

export default function OptimizedImage({
  src,
  lowQualitySrc,
  alt,
  // Destructure fill, width, height explicitly
  fill,
  width,
  height,
  sizes, // Keep sizes here to potentially override default
  className,
  ...props // Collect remaining props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  // Start with low quality src if available, otherwise use main src
  const [imageSrc, setImageSrc] = useState(lowQualitySrc || src)

  // Effect to load the high-quality image in the background
  useEffect(() => {
    // If no low quality src is provided, we are already using the main src
    if (!lowQualitySrc) {
      setIsLoading(false) // Ensure loading state is false if only high-res is used
      return
    }

    // Preload the high quality image
    const img = new window.Image()
    img.src = src

    img.onload = () => {
      setImageSrc(src) // Switch to high quality src
      setIsLoading(false) // Update loading state
    }
    // Add error handling for image loading
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`)
      // Optionally, keep the low quality image or show a placeholder
      setIsLoading(false) // Still need to update loading state
    }
  }, [src, lowQualitySrc])

  // Prepare props for the underlying next/image component
  const imageProps: ImageProps = {
    src: imageSrc,
    alt: alt,
    // Combine the transition class with the passed className
    className: `transition-opacity duration-500 blur-sm ${
      !isLoading ? 'blur-0' : ''
    } ${className || ''} object-cover`,
    onLoad: () => setIsLoading(false),
    ...props, // Spread remaining props first
  }

  // Conditionally add fill/sizes or width/height
  if (fill) {
    imageProps.fill = true
    // Provide default sizes only if fill is true and no sizes prop was passed
    imageProps.sizes = sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  } else {
    // Only pass width/height if fill is not true
    if (width) imageProps.width = width
    if (height) imageProps.height = height
    // Do not pass sizes if fill is false
  }

  // Always use wrapper div with conditional classes
  return (
    <div className={fill ? "absolute inset-0 z-0" : "relative overflow-hidden"}>
      <Image {...imageProps} />
    </div>
  )
}
