'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getOwnedShops } from '@/utils/auth';
import Link from 'next/link';
import { Shop } from '@/utils/data';

export default function DashboardPage() {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoading(true);
        const ownedShops = await getOwnedShops();
        setShops(ownedShops);
      } catch (err) {
        console.error('Error fetching owned shops:', err);
        setError('Failed to load your shops. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchShops();
    }
  }, [user]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Shops</h2>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 rounded-md">
          {error}
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No Shops Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don&apos;t have any shops yet. Claim a shop to get started.
          </p>
          <Link
            href="/dashboard/claim"
            className="btn-primary inline-block"
          >
            Claim a Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* Shop Info */}
                <div className="p-6 flex-1">
                  <h3 className="text-xl font-bold mb-2">{shop.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {shop.formatted_address}
                  </p>
                  
                  {/* Premium Status */}
                  {shop.is_premium ? (
                    <div className="mb-4 flex items-center">
                      <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Featured until {new Date(shop.featured_until!).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Standard Listing
                      </span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Link
                      href={`/dashboard/edit/${shop.id}`}
                      className="btn-primary text-sm py-1 px-3"
                    >
                      Edit Details
                    </Link>
                    <Link
                      href={`/boba-shop/${shop.slug}`}
                      className="btn-secondary text-sm py-1 px-3"
                      target="_blank"
                    >
                      View Listing
                    </Link>
                    {!shop.is_premium && (
                      <Link
                        href={`/dashboard/upgrade/${shop.id}`}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-1 px-3 rounded-md transition-colors"
                      >
                        Upgrade to Featured
                      </Link>
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 md:w-64">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                      <p className="text-xl font-bold flex items-center">
                        {shop.rating.toFixed(1)}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Reviews</p>
                      <p className="text-xl font-bold">{shop.user_ratings_total}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
