import React from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | Discover Boba',
  description: 'Reset your Discover Boba account password.',
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Check if this is a password reset link with a token
  const hasResetToken = typeof searchParams.token === 'string' && searchParams.token.length > 0;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="container-custom">
        {hasResetToken ? (
          // If we have a token, show the update password form
          <UpdatePasswordForm />
        ) : (
          // Otherwise, show the request password reset form
          <ResetPasswordForm />
        )}
      </div>
    </main>
  );
}
