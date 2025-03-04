'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect based on user role
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
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}