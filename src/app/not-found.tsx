import Link from 'next/link'
import OptimizedImage from '@/components/OptimizedImage'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="relative h-48 w-48 mx-auto mb-6">
          <OptimizedImage
            src="/images/boba-cat.jpeg"
            alt="Boba Cat"
            fill
            className="object-cover rounded-full"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Oops! It looks like the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/find-boba-shops" className="btn-secondary">
            Find Boba Shops
          </Link>
        </div>
      </div>
    </main>
  )
}
