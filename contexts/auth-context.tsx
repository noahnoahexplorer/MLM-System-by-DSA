// contexts/auth-context.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type UserProfile = {
  id: string;
  username: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (roles: string[]) => boolean;
  hasAnyPermission: (roles: string[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch user profile from the database
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log('Profile fetched successfully:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const profile = await fetchUserProfile(user.id);
    setProfile(profile);
  };

  // Check if user has all required roles
  const hasPermission = (roles: string[]): boolean => {
    if (!profile) return false;
    if (!roles || roles.length === 0) return true; // No roles required
    return roles.includes(profile.role);
  };

  // Check if user has any of the required roles
  const hasAnyPermission = (roles: string[]): boolean => {
    if (!profile) return false;
    if (!roles || roles.length === 0) return true; // No roles required
    return roles.includes(profile.role);
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session:', session ? 'exists' : 'null');
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setProfile(profile);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        console.log('New session:', session ? 'exists' : 'null');
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setProfile(profile);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      console.log("Signing out...");
      
      // First, sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Then clear all auth state
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Then clear storage
      if (typeof window !== 'undefined') {
        // Clear all Supabase-related items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('supabase.') || key.startsWith('sb-'))) {
            keysToRemove.push(key);
          }
        }
        // Remove keys in a separate loop to avoid index shifting issues
        keysToRemove.forEach(key => localStorage.removeItem(key));
        sessionStorage.clear();
        
        // Clear cookies related to auth
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name.includes('supabase') || name.includes('sb-')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          }
        });
      }
      
      // Force a hard navigation to login page with cache busting
      const timestamp = new Date().getTime();
      window.location.href = `/login?t=${timestamp}`;
    } catch (error) {
      console.error("Error during sign out:", error);
      // Still redirect even if there's an error
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signOut,
        refreshProfile,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}