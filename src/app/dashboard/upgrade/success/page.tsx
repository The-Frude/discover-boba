'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { Shop } from '@/utils/data';

// Loading component for Suspense fallback
function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 rounded-full bg-primary-200 dark:bg-primary-900 mb-4"></div>
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

// Content component that uses hooks
function UpgradeSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the shop ID from the URL query parameters
  const shopId = searchParams.get('shopId');
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    const loadShopDetails = async () => {
      try {
        if (!shopId) {
          setError('Shop ID not found in URL parameters');
          setIsLoading(false);
          return;
        }
        
        // Load shop data
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('id', shopId)
          .single();
          
        if (error) {
          throw error;
        }
        
        setShop(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading shop details:', err);
        setError('Failed to load shop details. Please try again later.');
        setIsLoading(false);
      }
    };
    
    loadShopDetails();
    
    // Redirect to dashboard after 5 seconds
    const redirectTimer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);
    
    return () => clearTimeout(redirectTimer);
  }, [shopId, router]);
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <Link href="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Thank you for upgrading to Premium. Your shop is now featured!
        </p>
        
        {shop && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg w-full mb-6">
            <h3 className="font-bold text-xl">{shop.name}</h3>
            <p className="text-gray-600 dark:text-gray-400">{shop.formatted_address}</p>
            {shop.featured_until && (
              <p className="mt-2 text-green-600 dark:text-green-400">
                Premium until: {new Date(shop.featured_until).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You will be redirected to your dashboard in a few seconds...
        </p>
        
        <Link href="/dashboard" className="btn-primary">
          Go to Dashboard Now
        </Link>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="font-semibold mb-4">What happens next?</h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">Your shop will appear at the top of search results</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">Your listing will be highlighted with a premium badge</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">You can add a custom "Order Now" button to your listing</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <UpgradeSuccessContent />
    </Suspense>
  );
}
