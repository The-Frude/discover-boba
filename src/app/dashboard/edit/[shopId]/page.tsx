'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isShopOwner } from '@/utils/auth';
import { supabase } from '@/utils/supabase';
import { Shop } from '@/utils/data';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ShopEditPageProps {
  params: {
    shopId: string;
  };
}

export default function ShopEditPage({ params }: ShopEditPageProps) {
  const { shopId } = params;
  const { user } = useAuth();
  const router = useRouter();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [menuLink, setMenuLink] = useState('');
  const [orderLink, setOrderLink] = useState('');
  const [featuredOrderUrl, setFeaturedOrderUrl] = useState('');
  
  // Check ownership and load shop data
  useEffect(() => {
    const checkOwnershipAndLoadShop = async () => {
      try {
        setIsLoading(true);
        
        // Check if user owns this shop
        const isOwner = await isShopOwner(shopId);
        
        if (!isOwner) {
          setError('You do not have permission to edit this shop.');
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
        
        // Initialize form state
        setName(data.name || '');
        setPhone(data.formatted_phone_number || '');
        setEmail(data.email || '');
        setWebsite(data.website || '');
        setMenuLink(data.menu_link || '');
        setOrderLink(data.order_links || '');
        setFeaturedOrderUrl(data.featured_order_url || '');
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shop) return;
    
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      // Update shop data
      const { error } = await supabase
        .from('shops')
        .update({
          name,
          formatted_phone_number: phone,
          email,
          website,
          menu_link: menuLink,
          order_links: orderLink,
          featured_order_url: featuredOrderUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId);
        
      if (error) {
        throw error;
      }
      
      setSaveSuccess(true);
      
      // Update local shop state
      setShop({
        ...shop,
        name,
        formatted_phone_number: phone,
        email,
        website,
        menu_link: menuLink,
        order_links: orderLink,
        featured_order_url: featuredOrderUrl
      });
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error updating shop:', err);
      setSaveError('Failed to update shop details. Please try again.');
    } finally {
      setIsSaving(false);
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
  
  if (!shop) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Shop Not Found</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">The shop you are trying to edit could not be found.</p>
        <Link href="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Edit Shop Details</h2>
        <Link
          href={`/boba-shop/${shop.slug}`}
          className="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center"
          target="_blank"
        >
          View Listing
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </Link>
      </div>
      
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-200 rounded-md">
          Shop details updated successfully!
        </div>
      )}
      
      {saveError && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 rounded-md">
          {saveError}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Shop Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900"
                  />
                </div>
                
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900"
                  />
                </div>
              </div>
            </div>
            
            {/* Menu and Ordering */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Menu and Ordering</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="menuLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Menu Link
                  </label>
                  <input
                    id="menuLink"
                    type="url"
                    value={menuLink}
                    onChange={(e) => setMenuLink(e.target.value)}
                    placeholder="https://example.com/menu"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900"
                  />
                </div>
                
                <div>
                  <label htmlFor="orderLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order Link
                  </label>
                  <input
                    id="orderLink"
                    type="url"
                    value={orderLink}
                    onChange={(e) => setOrderLink(e.target.value)}
                    placeholder="https://example.com/order"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900"
                  />
                </div>
              </div>
            </div>
            
            {/* Featured Listing Options */}
            {shop.is_premium && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Featured Listing Options</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="featuredOrderUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Featured Order URL
                    </label>
                    <input
                      id="featuredOrderUrl"
                      type="url"
                      value={featuredOrderUrl}
                      onChange={(e) => setFeaturedOrderUrl(e.target.value)}
                      placeholder="https://example.com/order-now"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      This URL will be used for the "Order Now" button on your featured listing.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Read-only Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Location Information (Read-only)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <div className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-400">
                    {shop.formatted_address}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Contact support to update your address.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <div className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-600 dark:text-gray-400">
                    {shop.city}, {shop.state}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
