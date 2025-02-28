'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const { user, profile, session, isLoading } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSessionData(data);
    };
    
    checkSession();
  }, [supabase]);
  
  const refreshSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSessionData(data);
  };
  
  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">User:</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-auto">
                  {user ? JSON.stringify(user, null, 2) : 'No user'}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold">Profile:</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-auto">
                  {profile ? JSON.stringify(profile, null, 2) : 'No profile'}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold">Session:</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-auto">
                  {session ? JSON.stringify(session, null, 2) : 'No session'}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Direct Session Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Session Data:</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-auto">
                  {sessionData ? JSON.stringify(sessionData, null, 2) : 'No session data'}
                </pre>
              </div>
              
              <Button onClick={refreshSession}>Refresh Session</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 