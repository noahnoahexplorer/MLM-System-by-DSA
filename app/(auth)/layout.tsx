'use client';

import { useAuth } from '@/contexts/auth-context';
import { redirect } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    redirect('/weekly-commission');
  }

  return children;
} 