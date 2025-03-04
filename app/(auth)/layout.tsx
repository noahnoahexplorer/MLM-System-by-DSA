// In app/(auth)/layout.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Only redirect if we have a user, we're not loading, and we haven't attempted a redirect yet
    if (!isLoading && user && !redirectAttempted) {
      console.log("Auth layout - redirecting authenticated user based on role");
      setRedirectAttempted(true);
      
      if (user.role.toUpperCase() === 'MARKETING OPS') {
        router.replace('/marketing-ops-finalized-commission');
      } else if (user.role.toUpperCase() === 'COMPLIANCE') {
        router.replace('/compliance-checklist');
      } else if (user.role.toUpperCase() === 'ADMIN') {
        router.replace('/compliance-checklist');
      } else {
        // Default for MARKETING role and any other roles
        router.replace('/reports');
      }
    }
  }, [user, isLoading, router, redirectAttempted]);

  // If we're still loading, show a loading indicator
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If we have a user but haven't redirected yet, show a loading indicator
  if (user && !redirectAttempted) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  // Otherwise, show the children (login/register form)
  return <>{children}</>;
}