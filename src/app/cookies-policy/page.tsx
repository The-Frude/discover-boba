import { Metadata } from 'next'
import OptimizedImage from '@/components/OptimizedImage'
import MarkdownContent from '@/components/MarkdownContent'
import cookiesPolicy from './cookies-policy.md'

// Update the effective date in the markdown content
const updatedPolicy = cookiesPolicy.replace(
  '[Insert date]', 
  new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
)

export const metadata: Metadata = {
  title: 'Cookies Policy | Discover Boba',
  description: 'Learn how Discover Boba uses cookies and tracking technologies.',
}

export default function CookiesPolicyPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/header-holder.jpg"
            alt="Cookies Policy"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </div>
        <div className="container-custom relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Cookies Policy
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            How we use cookies and tracking technologies
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <MarkdownContent content={updatedPolicy} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
