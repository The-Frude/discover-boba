import { supabase } from './supabase';

/**
 * Confirms a user's email using the verification code from the email link
 * @param code The verification code from the email link
 * @param email The user's email address
 * @returns An object with success status and optional error
 */
export const confirmEmail = async (code: string, email: string) => {
  try {
    if (!code) {
      return { success: false, error: new Error('Verification code is required') };
    }

    if (!email) {
      return { success: false, error: new Error('Email is required') };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      type: 'signup',
      token: code,
      email: email
    });
    
    if (error) {
      console.error('Error confirming email:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error confirming email:', error);
    return { success: false, error };
  }
};

/**
 * Gets the stored email from localStorage
 * This is used during email verification when the user doesn't have an active session yet
 * @returns The stored email or null if not found
 */
export const getStoredEmail = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('signupEmail');
};

/**
 * Clears the stored email from localStorage
 */
export const clearStoredEmail = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('signupEmail');
};
