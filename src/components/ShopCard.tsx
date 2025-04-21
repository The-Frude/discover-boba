import Link from 'next/link'
import { Shop } from '@/utils/data'
import OptimizedImage from './OptimizedImage'

interface ShopCardProps {
  shop: Shop
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <div className="card group">
      <div className="h-48 relative overflow-hidden">
        <OptimizedImage
          src={shop.photos?.[0] || "/images/boba-cat.jpeg"}
          alt={shop.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {shop.rating > 0 && (
          <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 font-bold px-2 py-1 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {shop.rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-6">
        <Link href={`/boba-shop/${shop.slug}`} className="block">
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {shop.name}
          </h3>
        </Link>
        <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">
          {shop.formatted_address}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {shop.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
          {shop.tags.length > 3 && (
            <span className="tag bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              +{shop.tags.length - 3} more
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {shop.user_ratings_total} reviews
          </span>
          <Link 
            href={`/boba-shop/${shop.slug}`}
            className="text-primary-600 dark:text-primary-400 font-medium text-sm flex items-center"
          >
            View Details
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
