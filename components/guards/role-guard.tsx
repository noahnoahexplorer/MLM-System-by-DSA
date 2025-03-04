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
  const { isLoading, user, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && !hasPermission(allowedRoles)) {
      router.push(fallbackPath);
    }
  }, [isLoading, user, hasPermission, allowedRoles, fallbackPath, router]);

  if (isLoading) {
    return showLoader ? (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ) : null;
  }

  if (!user || !hasPermission(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
} 