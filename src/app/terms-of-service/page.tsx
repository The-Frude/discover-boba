import { Metadata } from 'next'
import OptimizedImage from '@/components/OptimizedImage'
import MarkdownContent from '@/components/MarkdownContent'
import termsOfService from './terms-of-service.md'

// Update the effective date in the markdown content
const updatedTerms = termsOfService.replace(
  '[Insert date]', 
  new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
)

export const metadata: Metadata = {
  title: 'Terms of Service | Discover Boba',
  description: 'Terms governing your use of the Discover Boba website.',
}

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/header-holder.jpg"
            alt="Terms of Service"
            fill
            priority
            className="object-cover brightness-50"
            sizes="100vw"
          />
        </div>
        <div className="container-custom relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            The legal terms governing your use of our site
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <MarkdownContent content={updatedTerms} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
