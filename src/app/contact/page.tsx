import { Metadata } from 'next'
import OptimizedImage from '@/components/OptimizedImage'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us | Discover Boba',
  description: 'Get in touch with the Discover Boba team. Send us feedback, report issues, or suggest new cities to add to our database.',
  keywords: 'contact, feedback, boba tea, bubble tea, suggestions, report issues',
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/header-holder.jpg"
            alt="Contact Us"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </div>
        <div className="container-custom relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Contact Us
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            We'd love to hear from you! Send us your feedback, suggestions, or questions.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <ContactForm />
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="h-10 w-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Email Us</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  TalkToUs@discoverboba.com
                </p>
              </div>
              
{/*              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="h-10 w-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Social Media</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Follow us @discoverboba
                </p>
              </div> */}
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="h-10 w-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Suggest a City</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Want to see your city added? Let us know!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">How can I suggest a new city?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  You can use the contact form above to suggest a new city. We're constantly expanding our database and appreciate your input!
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">How do I report an issue with a shop listing?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  If you notice incorrect information about a shop, please use the contact form and include the shop name and city in your message.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">Can I add my boba shop to your directory?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! Shop owners can submit their information through the contact form. Please include all relevant details about your shop.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
