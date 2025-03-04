'use client';

import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Auth-related paths that shouldn't show the sidebar
  const authPaths = ['/login', '/signup', '/register', '/forgot-password', '/reset-password', '/unauthorized', '/debug'];
  const isAuthPath = authPaths.some(path => pathname?.startsWith(path));

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle redirects
  useEffect(() => {
    if (!mounted) return;

    // Redirect authenticated users from home to appropriate dashboard based on role
    if (user && pathname === '/') {
      if (user.role.toUpperCase() === 'MARKETING OPS') {
        router.push('/marketing-ops-finalized-commission');
      } else if (user.role.toUpperCase() === 'COMPLIANCE') {
        router.push('/compliance-checklist');
      } else if (user.role.toUpperCase() === 'ADMIN') {
        router.push('/compliance-checklist');
      } else {
        // Default for MARKETING role and any other roles
        router.push('/reports');
      }
    }
    
    // Redirect authenticated users from auth pages to appropriate dashboard
    if (user && isAuthPath) {
      if (user.role.toUpperCase() === 'MARKETING OPS') {
        router.push('/marketing-ops-finalized-commission');
      } else if (user.role.toUpperCase() === 'COMPLIANCE') {
        router.push('/compliance-checklist');
      } else if (user.role.toUpperCase() === 'ADMIN') {
        router.push('/compliance-checklist');
      } else {
        // Default for MARKETING role and any other roles
        router.push('/reports');
      }
    }
    
    // Redirect unauthenticated users from protected pages to login
    if (!user && !authLoading && !isAuthPath && pathname !== '/') {
      router.push('/login');
    }
  }, [user, pathname, router, mounted, authLoading, isAuthPath]);

  // Show loading state only during initial load
  if (!mounted || (authLoading && !isAuthPath)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show layout with sidebar for authenticated users on non-auth paths
  if (!isAuthPath && user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    );
  }

  // For auth paths or unauthenticated users, just show the content
  return <div className="min-h-screen">{children}</div>;
} 