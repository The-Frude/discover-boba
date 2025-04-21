'use client'

import { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string
  lowQualitySrc?: string
  alt: string
  sizes?: string
}

export default function OptimizedImage({
  src,
  lowQualitySrc,
  alt,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [imageSrc, setImageSrc] = useState(lowQualitySrc || src)
  
  // Use effect to handle image loading
  useEffect(() => {
    // If no low quality src is provided, just use the main src
    if (!lowQualitySrc) {
      setImageSrc(src)
      return
    }
    
    // Preload the high quality image
    const img = new window.Image()
    img.src = src
    
    img.onload = () => {
      setImageSrc(src)
      setIsLoading(false)
    }
  }, [src, lowQualitySrc])
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        sizes={sizes}
        className={`transition-opacity duration-500 ${isLoading ? 'blur-sm' : 'blur-0'}`}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </div>
  )
}
