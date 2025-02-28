'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Access Denied
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              You don't have permission to access this page.
            </p>
            
            {profile && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your current role: <span className="font-medium">{profile.role}</span>
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => router.push('/')}
              variant="default"
            >
              Go to Home
            </Button>
            
            <Button 
              onClick={signOut}
              variant="outline"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 