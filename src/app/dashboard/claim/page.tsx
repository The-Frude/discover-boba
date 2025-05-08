'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createShopClaimRequest } from '@/utils/auth';
import { supabase } from '@/utils/supabase';
import { Shop } from '@/utils/data';
import Link from 'next/link';

export default function ClaimShopPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Shop[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [claimMessage, setClaimMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setSearchError('Please enter a shop name or location');
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    
    try {
      // Search for shops by name or address
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,formatted_address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
        .limit(10);
        
      if (error) {
        throw error;
      }
      
      setSearchResults(data || []);
      
      if (data.length === 0) {
        setSearchError('No shops found matching your search. Try a different search term.');
      }
    } catch (err) {
      console.error('Error searching shops:', err);
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle shop selection
  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Handle claim submission
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShop) {
      setSubmitError('Please select a shop to claim');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Check if the shop already has an owner
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('owner_id')
        .eq('id', selectedShop.id)
        .single();
        
      if (shopError) {
        throw shopError;
      }
      
      if (shopData.owner_id) {
        setSubmitError('This shop has already been claimed by another user.');
        setIsSubmitting(false);
        return;
      }
      
      // Check if there's already a pending claim for this shop
      const { data: existingClaims, error: claimError } = await supabase
        .from('shop_claim_requests')
        .select('id, status')
        .eq('shop_id', selectedShop.id)
        .eq('status', 'pending');
        
      if (claimError) {
        throw claimError;
      }
      
      if (existingClaims && existingClaims.length > 0) {
        setSubmitError('There is already a pending claim for this shop.');
        setIsSubmitting(false);
        return;
      }
      
      // Submit the claim request
      await createShopClaimRequest(selectedShop.id, claimMessage);
      
      // Reset form and show success message
      setSubmitSuccess(true);
      setSelectedShop(null);
      setClaimMessage('');
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error submitting claim:', err);
      setSubmitError('An error occurred while submitting your claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Claim Your Shop</h2>
      
      {submitSuccess ? (
        <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 p-6 rounded-lg mb-8">
          <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">Claim Request Submitted!</h3>
          <p className="text-green-700 dark:text-green-300 mb-4">
            Your claim request has been submitted successfully. Our team will review your request and get back to you soon.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => setSubmitSuccess(false)}
              className="btn-primary"
            >
              Claim Another Shop
            </button>
            <Link href="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <>
          {!selectedShop ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Search for Your Shop</h3>
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter shop name or location"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="btn-primary"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {searchError && (
                  <p className="mt-2 text-red-600 dark:text-red-400 text-sm">{searchError}</p>
                )}
              </form>
              
              {isSearching ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Select your shop from the results:</h4>
                  {searchResults.map((shop) => (
                    <div
                      key={shop.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => handleSelectShop(shop)}
                    >
                      <h5 className="font-bold">{shop.name}</h5>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{shop.formatted_address}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Claim Request</h3>
              
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Shop:</h4>
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold">{selectedShop.name}</h5>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedShop.formatted_address}</p>
                  </div>
                  <button
                    onClick={() => setSelectedShop(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Change
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmitClaim}>
                <div className="mb-6">
                  <label htmlFor="claimMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    id="claimMessage"
                    value={claimMessage}
                    onChange={(e) => setClaimMessage(e.target.value)}
                    placeholder="Provide any additional information about your ownership of this shop"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900"
                    rows={4}
                  ></textarea>
                </div>
                
                {submitError && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 rounded-md">
                    {submitError}
                  </div>
                )}
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setSelectedShop(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg">
            <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-2">What happens next?</h3>
            <p className="text-blue-700 dark:text-blue-400 text-sm">
              After submitting your claim, our team will review it and verify your ownership. 
              This process typically takes 1-2 business days. Once approved, you'll be able to 
              edit your shop details and access premium features.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
