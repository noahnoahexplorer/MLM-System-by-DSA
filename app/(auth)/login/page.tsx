'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [supabase] = useState(() => createBrowserSupabaseClient());

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Login page - session check:", session ? "Session exists" : "No session");
        
        if (session) {
          console.log("User already logged in, redirecting...");
          router.replace(redirectedFrom || '/weekly-commission');
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    checkSession();
  }, [redirectedFrom, router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Login attempt with:", formData.email);

    if (!formData.email || !formData.password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting Supabase auth with email:", formData.email);
      
      // Sign in with Supabase using email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      console.log("Auth response data:", data ? "Data received" : "No data");
      console.log("Auth response error:", error ? error.message : "No error");

      if (error) {
        console.error("Auth error details:", error);
        let errorMessage = error.message || 'Invalid email or password';
        
        toast({
          title: 'Authentication Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        // Clear password field on error
        setFormData(prev => ({
          ...prev,
          password: '',
        }));
      } else {
        // Show success toast and redirect after a short delay
        toast({
          title: 'Success',
          description: 'Login successful! Redirecting...',
        });
        
        // Wait a moment for the toast to show before redirecting
        setTimeout(() => {
          router.replace(redirectedFrom || '/weekly-commission');
        }, 1000);
      }
    } catch (error) {
      console.error("Exception during login:", error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      // Clear password field on error
      setFormData(prev => ({
        ...prev,
        password: '',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-4">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
              <CardDescription className="text-center">
                Enter your email and password to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 