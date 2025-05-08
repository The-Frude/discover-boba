'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllClaimRequests, approveClaimRequest, rejectClaimRequest } from '@/utils/auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

interface ClaimRequest {
  id: string;
  shop_id: string;
  user_id: string;
  status: string;
  message: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  shops: {
    id: string;
    name: string;
    slug: string;
    formatted_address: string;
    city: string;
    state: string;
  };
  users: {
    id: string;
    email: string;
  };
}

export default function AdminClaimsPage() {
  const { isAdmin } = useAuth();
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<{ [key: string]: string }>({});
  const [showRejectForm, setShowRejectForm] = useState<{ [key: string]: boolean }>({});
  
  // Load claim requests
  useEffect(() => {
    const fetchClaimRequests = async () => {
      try {
        setIsLoading(true);
        const requests = await getAllClaimRequests();
        setClaimRequests(requests as ClaimRequest[]);
      } catch (err) {
        console.error('Error fetching claim requests:', err);
        setError('Failed to load claim requests. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClaimRequests();
  }, []);
  
  // Handle approve claim
  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await approveClaimRequest(requestId);
      
      // Update local state
      setClaimRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status: 'approved' } : req
        )
      );
    } catch (err) {
      console.error('Error approving claim:', err);
      setError('Failed to approve claim. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Handle reject claim
  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const notes = rejectNotes[requestId] || '';
      await rejectClaimRequest(requestId, notes);
      
      // Update local state
      setClaimRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status: 'rejected', admin_notes: notes } : req
        )
      );
      
      // Reset form
      setShowRejectForm({ ...showRejectForm, [requestId]: false });
      setRejectNotes({ ...rejectNotes, [requestId]: '' });
    } catch (err) {
      console.error('Error rejecting claim:', err);
      setError('Failed to reject claim. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Toggle reject form
  const toggleRejectForm = (requestId: string) => {
    setShowRejectForm({ ...showRejectForm, [requestId]: !showRejectForm[requestId] });
  };
  
  // Update reject notes
  const updateRejectNotes = (requestId: string, notes: string) => {
    setRejectNotes({ ...rejectNotes, [requestId]: notes });
  };
  
  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container-custom">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Shop Claim Requests</h1>
              <Link href="/admin/dashboard" className="text-primary-600 dark:text-primary-400 hover:underline">
                Back to Admin Dashboard
              </Link>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 rounded-md">
                {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ) : claimRequests.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h3 className="text-xl font-medium mb-2">No Claim Requests</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  There are no shop claim requests to review at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending Requests */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
                  <div className="space-y-4">
                    {claimRequests.filter(req => req.status === 'pending').length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400">No pending requests.</p>
                    ) : (
                      claimRequests
                        .filter(req => req.status === 'pending')
                        .map(request => (
                          <div 
                            key={request.id} 
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                          >
                            <div className="flex flex-col md:flex-row justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold">{request.shops.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                  {request.shops.formatted_address}
                                </p>
                              </div>
                              <div className="mt-2 md:mt-0">
                                <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  Pending
                                </span>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Requested by:</span> {request.users.email}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Date:</span> {new Date(request.created_at).toLocaleString()}
                              </p>
                            </div>
                            
                            {request.message && (
                              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Message:</span> {request.message}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() => handleApprove(request.id)}
                                disabled={processingId === request.id}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === request.id ? 'Processing...' : 'Approve'}
                              </button>
                              
                              {showRejectForm[request.id] ? (
                                <div className="w-full mt-3">
                                  <textarea
                                    value={rejectNotes[request.id] || ''}
                                    onChange={(e) => updateRejectNotes(request.id, e.target.value)}
                                    placeholder="Reason for rejection (optional)"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 mb-2"
                                    rows={2}
                                  ></textarea>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleReject(request.id)}
                                      disabled={processingId === request.id}
                                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processingId === request.id ? 'Processing...' : 'Confirm Rejection'}
                                    </button>
                                    <button
                                      onClick={() => toggleRejectForm(request.id)}
                                      className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-1 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => toggleRejectForm(request.id)}
                                  disabled={processingId === request.id}
                                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Reject
                                </button>
                              )}
                              
                              <Link
                                href={`/boba-shop/${request.shops.slug}`}
                                target="_blank"
                                className="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center"
                              >
                                View Shop
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                              </Link>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
                
                {/* Processed Requests */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Processed Requests</h2>
                  <div className="space-y-4">
                    {claimRequests.filter(req => req.status !== 'pending').length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400">No processed requests.</p>
                    ) : (
                      claimRequests
                        .filter(req => req.status !== 'pending')
                        .map(request => (
                          <div 
                            key={request.id} 
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                          >
                            <div className="flex flex-col md:flex-row justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold">{request.shops.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                  {request.shops.formatted_address}
                                </p>
                              </div>
                              <div className="mt-2 md:mt-0">
                                {request.status === 'approved' ? (
                                  <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    Approved
                                  </span>
                                ) : (
                                  <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    Rejected
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Requested by:</span> {request.users.email}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Date:</span> {new Date(request.created_at).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Processed:</span> {new Date(request.updated_at).toLocaleString()}
                              </p>
                            </div>
                            
                            {request.message && (
                              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Message:</span> {request.message}
                                </p>
                              </div>
                            )}
                            
                            {request.admin_notes && (
                              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Admin Notes:</span> {request.admin_notes}
                                </p>
                              </div>
                            )}
                            
                            <Link
                              href={`/boba-shop/${request.shops.slug}`}
                              target="_blank"
                              className="text-primary-600 dark:text-primary-400 hover:underline text-sm flex items-center"
                            >
                              View Shop
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                            </Link>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
