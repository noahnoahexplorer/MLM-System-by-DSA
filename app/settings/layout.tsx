'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role.toUpperCase() !== 'ADMIN')) {
      console.log('Client-side layout: Not admin, redirecting');
      router.push('/unauthorized');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Only render children if user is admin
  if (!isLoading && user && user.role.toUpperCase() === 'ADMIN') {
    return <>{children}</>;
  }

  // Return null while redirecting
  return (
    <div className="flex justify-center items-center py-10">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
} 