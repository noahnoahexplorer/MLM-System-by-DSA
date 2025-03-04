'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/auth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
  showLoader?: boolean;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPath = '/unauthorized',
  showLoader = true
}: RoleGuardProps) {
  const { profile, isLoading, user, checkSessionValidity } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only run this effect if we're not in a loading state
    if (!isLoading) {
      const validateAccess = async () => {
        // First check if we have a user
        if (!user) {
          console.log("No user found, redirecting to login");
          router.replace('/login');
          return;
        }
        
        // Then check if session is valid
        const isSessionValid = await checkSessionValidity();
        
        if (!isSessionValid) {
          console.log("Invalid session, redirecting to login");
          router.replace('/login');
          return;
        }
        
        // Finally check role permissions
        if (profile && !allowedRoles.includes(profile.role as UserRole)) {
          console.log(`User role ${profile.role} not in allowed roles, redirecting to ${fallbackPath}`);
          router.replace(fallbackPath);
        }
      };
      
      validateAccess();
    }
  }, [profile, isLoading, user, allowedRoles, fallbackPath, router, checkSessionValidity]);

  // Show loading state
  if (isLoading && showLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only render children if user has permission
  if (!isLoading && user && profile && allowedRoles.includes(profile.role as UserRole)) {
    return <>{children}</>;
  }

  // Show a minimal loader while redirecting
  if (showLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Render nothing while redirecting if showLoader is false
  return null;
} 