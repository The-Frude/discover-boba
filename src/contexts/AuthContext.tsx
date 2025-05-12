'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getSignUpOptions } from '@/utils/supabase';

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signUp: (email: string, password: string, options?: { emailRedirectTo?: string }) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  isAdmin: boolean;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  isAdmin: false,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component to wrap the app with
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Get the current session and user
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        // Check if user is admin
        if (session?.user) {
          try {
            const { data } = await supabase.rpc('get_user_role', {
              user_id: session.user.id
            });
            
            // Check if data exists and has the expected structure
            if (data && typeof data === 'object' && 'role' in data) {
              setIsAdmin(data.role === 'admin');
            } else {
              setIsAdmin(false);
            }
          } catch (error) {
            console.error('Error checking admin role:', error);
            setIsAdmin(false);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Check if user is admin
        if (session?.user) {
          try {
            const { data } = await supabase.rpc('get_user_role', {
              user_id: session.user.id
            });
            
            // Check if data exists and has the expected structure
            if (data && typeof data === 'object' && 'role' in data) {
              setIsAdmin(data.role === 'admin');
            } else {
              setIsAdmin(false);
            }
          } catch (error) {
            console.error('Error checking admin role:', error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }

        setIsLoading(false);
      }
    );

    // Clean up the subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as Error, data: null };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, options?: { emailRedirectTo?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: options
      });
      return { data, error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error: error as Error, data: null };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset password (send reset email)
  const resetPassword = async (email: string) => {
    try {
      // Get the base URL from the signup options
      const options = getSignUpOptions();
      // Extract the base URL by removing the '/dashboard' part
      const baseUrl = options.emailRedirectTo?.replace('/dashboard', '');
      // Create the reset password URL
      const redirectUrl = baseUrl ? `${baseUrl}/reset-password` : `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error: error as Error };
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      return { error };
    } catch (error) {
      console.error('Error updating password:', error);
      return { error: error as Error };
    }
  };

  // Create the value object for the context
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
