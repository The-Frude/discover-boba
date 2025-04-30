'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-10 mr-3">
              <Image
                src="/images/bobacat-logo-med.png"
                alt="Discover Boba Logo"
                fill
                sizes="100vw" // Changed sizes prop to test warning suppression
                className="object-cover rounded-full"
              />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Discover Boba</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`font-medium ${isActive('/') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'}`}
            >
              Home
            </Link>
            <Link 
              href="/find-boba-shops" 
              className={`font-medium ${isActive('/find-boba-shops') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'}`}
            >
              Find Shops
            </Link>
            <Link 
              href="/faq" 
              className={`font-medium ${isActive('/faq') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'}`}
            >
              FAQ
            </Link>
            <Link 
              href="/contact" 
              className={`font-medium ${isActive('/contact') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'}`}
            >
              Contact
            </Link>
          {/* Search form commented out
          <form 
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              if (searchQuery.trim().length > 1) {
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                setSearchQuery('')
              }
            }}
            className="relative"
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 w-40 lg:w-64"
            />
            <button type="submit" className="absolute left-3 top-2.5">
              <svg 
                className="h-5 w-5 text-gray-500 dark:text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
          */}
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600 dark:text-gray-300 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            {/* Search form commented out
            <form 
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                if (searchQuery.trim().length > 1) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                  setSearchQuery('')
                  setIsMenuOpen(false)
                }
              }}
              className="flex items-center mb-4 relative"
            >
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-grow"
              />
              <button type="submit" className="absolute left-3">
                <svg 
                  className="h-5 w-5 text-gray-500 dark:text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            */}
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className={`font-medium ${isActive('/') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/find-boba-shops" 
                className={`font-medium ${isActive('/find-boba-shops') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Find Shops
              </Link>
              <Link 
                href="/faq" 
                className={`font-medium ${isActive('/faq') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link 
                href="/contact" 
                className={`font-medium ${isActive('/contact') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
