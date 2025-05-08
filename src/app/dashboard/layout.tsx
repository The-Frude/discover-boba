'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  // Navigation items for the dashboard
  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Claim Shop', href: '/dashboard/claim' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Dashboard Header */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="container-custom py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop Owner Dashboard</h1>
          </div>
        </header>

        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 flex-shrink-0">
              <nav className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <ul>
                  {navItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          pathname === item.href
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium border-l-4 border-primary-600 dark:border-primary-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardLayout;
