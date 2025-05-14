'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isShopOwner } from '@/utils/auth';
import { supabase } from '@/utils/supabase';
import { Shop } from '@/utils/data';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { withSuspense } from '@/components/hoc/withSuspense';

interface UpgradePageProps {
  params: {
    shopId: string;
  };
}

// Premium plan options
const premiumPlans = [
  {
    id: 'premium-1',
    name: 'Premium 1 Month',
    price: 29.99,
    duration: 1,
    features: [
      'Featured placement in search results',
      'Highlighted listing with premium badge',
      'Custom "Order Now" button',
      'Priority customer support',
    ],
    popular: false,
  },
  {
    id: 'premium-3',
    name: 'Premium 3 Months',
    price: 79.99,
    duration: 3,
    features: [
      'Featured placement in search results',
      'Highlighted listing with premium badge',
      'Custom "Order Now" button',
      'Priority customer support',
      'Featured in "Top Boba Shops" section',
    ],
    popular: true,
    savings: '11% savings',
  },
  {
    id: 'premium-6',
    name: 'Premium 6 Months',
    price: 149.99,
    duration: 6,
    features: [
      'Featured placement in search results',
      'Highlighted listing with premium badge',
      'Custom "Order Now" button',
      'Priority customer support',
      'Featured in "Top Boba Shops" section',
      'Social media promotion',
    ],
    popular: false,
    savings: '17% savings',
  },
];

function UpgradePageContent({ params }: UpgradePageProps) {
  const { shopId } = params;
  const { user } = useAuth();
  const router = useRouter();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(premiumPlans[1].id); // Default to 3-month plan
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Check ownership and load shop data
  useEffect(() => {
    const checkOwnershipAndLoadShop = async () => {
      try {
        setIsLoading(true);
        
        // Check if user owns this shop
        const isOwner = await isShopOwner(shopId);
        
        if (!isOwner) {
          setError('You do not have permission to upgrade this shop.');
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
        
        // If shop is already premium, show message
        if (data.is_premium) {
          const featuredUntil = new Date(data.featured_until!);
          const today = new Date();
          
          if (featuredUntil > today) {
            setError(`This shop is already a premium listing until ${featuredUntil.toLocaleDateString()}.`);
          }
        }
      } catch (err) {
        console.error('Error loading shop:', err);
        setError('Failed to load shop details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      checkOwnershipAndLoadShop();
    }
  }, [user, shopId]);
  
  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };
  
  // Get selected plan details
  const getSelectedPlan = () => {
    return premiumPlans.find(plan => plan.id === selectedPlan);
  };
  
  // Initialize Stripe
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  // Handle upgrade submission
  const handleUpgrade = async () => {
    try {
      setIsProcessing(true);
      
      const plan = getSelectedPlan();
      if (!plan || !shop) {
        throw new Error('Invalid plan or shop');
      }
      
      // Ensure user is authenticated
      if (!user || !user.id) {
        throw new Error('You must be logged in to upgrade a shop');
      }
      
      // Determine plan type
      const planType = plan.duration === 1 ? 'MONTHLY' : 'ANNUAL';
      
      // Create checkout session with explicit userId
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId,
          planType,
          userId: user.id, // Explicitly pass user ID
          successUrl: `${window.location.origin}/dashboard/upgrade/success?shopId=${shopId}`,
          cancelUrl: `${window.location.origin}/dashboard/upgrade/${shopId}`,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const { url, error: apiError } = await response.json();
      
      if (apiError || !url) {
        throw new Error(apiError || 'Failed to create checkout session');
      }
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Failed to create checkout session. Please try again.');
      setIsProcessing(false);
    }
  };
  
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
  
  if (successMessage) {
    return (
      <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">Success!</h3>
        <p className="text-green-700 dark:text-green-300 mb-4">{successMessage}</p>
        <p className="text-green-700 dark:text-green-300 mb-4">Redirecting to dashboard...</p>
      </div>
    );
  }
  
  if (!shop) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Shop Not Found</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">The shop you are trying to upgrade could not be found.</p>
        <Link href="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Upgrade to Premium</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Shop Details</h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h4 className="font-bold text-xl">{shop.name}</h4>
            <p className="text-gray-600 dark:text-gray-400">{shop.formatted_address}</p>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Select a Premium Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {premiumPlans.map((plan) => (
              <div 
                key={plan.id}
                className={`border rounded-lg overflow-hidden transition-all ${
                  selectedPlan === plan.id 
                    ? 'border-primary-500 dark:border-primary-400 shadow-md' 
                    : 'border-gray-200 dark:border-gray-700'
                } ${
                  plan.popular 
                    ? 'relative' 
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="p-6">
                  <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.savings && (
                      <span className="ml-2 text-green-600 dark:text-green-400 text-sm font-medium">
                        {plan.savings}
                      </span>
                    )}
                  </div>
                  
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full py-2 px-4 rounded-md transition-colors ${
                      selectedPlan === plan.id
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg mb-4">
            <p className="text-blue-800 dark:text-blue-300">
              <strong>Secure Payment:</strong> You'll be redirected to Stripe's secure checkout page to complete your payment.
            </p>
            <p className="text-blue-800 dark:text-blue-300 mt-2">
              For testing, you can use card number <span className="font-mono">4242 4242 4242 4242</span> with any future expiration date and any 3-digit CVC.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-gray-600 dark:text-gray-400">Your payment will be processed securely by Stripe.</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-gray-600 dark:text-gray-400">Your premium status will be activated immediately after payment.</span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex justify-between mb-4">
            <span className="font-medium">Selected Plan:</span>
            <span>{getSelectedPlan()?.name}</span>
          </div>
          
          <div className="flex justify-between mb-6">
            <span className="font-medium">Total:</span>
            <span className="text-xl font-bold">${getSelectedPlan()?.price}</span>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Link
              href="/dashboard"
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="btn-primary"
            >
              {isProcessing ? 'Processing...' : 'Upgrade Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the component wrapped with Suspense
export default withSuspense(UpgradePageContent);
