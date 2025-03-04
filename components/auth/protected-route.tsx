'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { hasPermission, isLoading, user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If not loading and either no user or user doesn't have permission
    if (!isLoading) {
      if (!user) {
        router.replace(redirectTo);
      } else if (!hasPermission(allowedRoles)) {
        router.replace('/unauthorized');
      }
    }
  }, [isLoading, user, hasPermission, allowedRoles, redirectTo, router]);
  
  // While loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user has permission, render the children
  if (user && hasPermission(allowedRoles)) {
    return <>{children}</>;
  }
  
  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
} 