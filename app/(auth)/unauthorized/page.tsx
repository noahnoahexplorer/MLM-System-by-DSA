'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function UnauthorizedPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Access Denied
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              You don't have permission to access this page.
            </p>
            
            {user && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your current role: <span className="font-medium">{user.role}</span>
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => router.push('/weekly-commission')}
              variant="default"
              className="w-full"
            >
              Go to Dashboard
            </Button>
            
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
            
            <Button 
              onClick={signOut}
              variant="destructive"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 