import { Metadata } from 'next'
import Link from 'next/link'
import OptimizedImage from '@/components/OptimizedImage'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions About Boba Tea | Discover Boba',
  description: 'Learn everything you need to know about boba tea, bubble tea, and tapioca pearls. Find answers to common questions about this popular Taiwanese drink.',
  keywords: 'boba, bubble tea, tapioca pearls, milk tea, FAQ, questions, what is boba, boba tea ingredients',
}

export default function FAQPage() {
  const faqs = [
    {
      question: 'What is boba tea?',
      answer: 'Boba tea, also known as bubble tea, is a Taiwanese drink that typically consists of tea mixed with milk or fruits, sweetened with sugar, and topped with chewy tapioca pearls. It was invented in Taiwan in the 1980s and has since become popular worldwide.'
    },
    {
      question: 'What are the black balls in boba tea?',
      answer: 'The black balls in boba tea are tapioca pearls, also called boba. They\'re made from tapioca starch, which comes from the cassava root. The pearls are boiled and often sweetened with sugar or honey, giving them a chewy, gummy-like texture.'
    },
    {
      question: 'Is boba tea healthy?',
      answer: 'Traditional boba tea can be high in calories and sugar. However, many shops now offer healthier alternatives with less sugar, non-dairy milk options, or fruit-based teas. You can also customize your drink by asking for less sugar or no sugar at all.'
    },
    {
      question: 'What flavors of boba tea are there?',
      answer: 'Boba tea comes in countless flavors! Traditional options include black milk tea, taro, matcha, and Thai tea. Fruit flavors like mango, strawberry, and lychee are also popular. Many shops offer seasonal specialties and unique combinations.'
    },
    {
      question: 'What\'s the difference between boba tea and bubble tea?',
      answer: 'There\'s no difference—"boba tea" and "bubble tea" refer to the same drink. The name "bubble" may have originated from the bubbles that form when the drink is shaken, while "boba" refers specifically to the tapioca pearls.'
    },
    {
      question: 'Are there alternatives to tapioca pearls?',
      answer: 'Yes! Many boba shops offer alternatives like popping boba (fruit juice-filled spheres that burst in your mouth), grass jelly, aloe vera, red beans, pudding, and fruit jellies.'
    },
    {
      question: 'How do you drink boba tea?',
      answer: 'Boba tea is typically served with a wide straw large enough for the tapioca pearls to pass through. You drink the tea and eat the pearls at the same time. It\'s recommended to shake the drink before consuming to mix all the ingredients.'
    },
    {
      question: 'Can I make boba tea at home?',
      answer: 'Absolutely! You can purchase tapioca pearls, tea, and other ingredients online or at Asian grocery stores. There are many recipes available online for making boba tea at home, from traditional milk tea to fruit-based varieties.'
    },
    {
      question: 'How long does boba tea last?',
      answer: 'Boba tea is best consumed fresh, ideally within a few hours of preparation. The tapioca pearls tend to harden and lose their chewy texture over time. If you need to store it, keep it refrigerated and consume within 24 hours, though the texture of the pearls will change.'
    },
    {
      question: 'Is boba tea caffeinated?',
      answer: 'It depends on the base tea used. Drinks made with black or green tea contain caffeine, while fruit teas or drinks made without tea may be caffeine-free. Many shops offer caffeine-free options—just ask when ordering.'
    }
  ]

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src="/images/boba-cat.jpeg"
            alt="Boba Tea FAQ"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </div>
        <div className="container-custom relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Everything you need to know about boba tea
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                >
                  <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                    {faq.question}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to find the best boba tea near you?</h2>
              <Link href="/" className="btn-primary inline-block">
                Explore Boba Shops
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
