'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  return children;
} 