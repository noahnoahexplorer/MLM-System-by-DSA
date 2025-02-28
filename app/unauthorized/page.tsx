'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
      <p className="text-lg mb-6">
        You don't have permission to access this page.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push('/')}>
          Go to Home
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    </div>
  );
} 