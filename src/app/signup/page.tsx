import React from 'react';
import SignupForm from '@/components/auth/SignupForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Discover Boba',
  description: 'Create a Discover Boba account to claim your shop, manage your listing, and access premium features.',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen py-12 px-4">
      <div className="container-custom">
        <SignupForm />
      </div>
    </main>
  );
}
