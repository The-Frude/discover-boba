import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Discover Boba - Find the Best Boba Tea Shops',
  description: 'Discover the best boba tea shops in major cities across the United States. Find your perfect bubble tea experience with our comprehensive directory.',
  keywords: 'boba, bubble tea, boba shops, bubble tea shops, boba tea, milk tea, tapioca, pearls',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  manifest: '/site.webmanifest',
  other: {
    'google-adsense-account': 'ca-pub-2397860526597645',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <AuthProvider>
          <GoogleAnalytics />
          <Header />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
