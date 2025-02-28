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
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Auth-related paths that shouldn't show the sidebar
  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isAuthPath = authPaths.some(path => pathname?.startsWith(path));

  useEffect(() => {
    setMounted(true);
    
    // Only redirect if we're on the home page and the user is logged in
    if (user && pathname === '/') {
      router.push('/weekly-commission');
    }
    
    // Force timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Forcing loading state to complete after timeout');
        setMounted(true);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [user, pathname, router, isLoading]);

  // Show loading state while auth is being determined, but only briefly
  if (!mounted && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show layout with sidebar for authenticated users on non-auth pages
  if (user && !isAuthPath) {
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

  // For auth pages or unauthenticated users, just show the content
  return <div className="min-h-screen">{children}</div>;
} 