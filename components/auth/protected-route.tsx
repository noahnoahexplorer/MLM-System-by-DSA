'use client';

import { useAuth } from '@/contexts/auth-context';
import { redirect } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

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
  
  useEffect(() => {
    // If not loading and either no user or user doesn't have permission
    if (!isLoading && (!user || !hasPermission(allowedRoles))) {
      redirect(redirectTo);
    }
  }, [isLoading, user, hasPermission, allowedRoles, redirectTo]);
  
  // While loading, show nothing or a loading indicator
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // If user has permission, render the children
  if (user && hasPermission(allowedRoles)) {
    return <>{children}</>;
  }
  
  // This should not be reached due to the redirect in useEffect
  return null;
} 