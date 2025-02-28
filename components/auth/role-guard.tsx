'use client';

import { useAuth } from '@/contexts/auth-context';
import { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleGuardProps) {
  const { hasPermission, isLoading } = useAuth();
  
  // While loading, don't render anything or show a loading state
  if (isLoading) {
    return null;
  }
  
  // Check if the user has the required role
  if (!hasPermission(allowedRoles)) {
    return fallback;
  }
  
  // User has permission, render the children
  return <>{children}</>;
} 