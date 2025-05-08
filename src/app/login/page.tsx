import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In | Discover Boba',
  description: 'Log in to your Discover Boba account to manage your shop listings and access premium features.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen py-12 px-4">
      <div className="container-custom">
        <LoginForm />
      </div>
    </main>
  );
}
