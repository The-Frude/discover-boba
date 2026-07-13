import { Metadata } from 'next'
import OptimizedImage from '@/components/OptimizedImage'
import MarkdownContent from '@/components/MarkdownContent'
import privacyPolicy from './privacy-policy.md'

// Update the effective date in the markdown content
const updatedPolicy = privacyPolicy.replace(
  '[Insert date]', 
  new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
)

export const metadata: Metadata = {
  title: 'Privacy Policy | Discover Boba',
  description: 'Learn how Discover Boba collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/header-holder.jpg"
            alt="Privacy Policy"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </div>
        <div className="container-custom relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            How we collect, use, and protect your information
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
