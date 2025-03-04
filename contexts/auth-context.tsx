// contexts/auth-context.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole } from '@/types/auth';

// Define auth context type
interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  hasPermission: (roles: UserRole[]) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Check if user has the required role
  const hasPermission = (roles: UserRole[]): boolean => {
    if (!user) return false;
    if (!roles || roles.length === 0) return true; // No roles required
    
    // Case-insensitive role comparison
    return roles.some(role => 
      user.role.toUpperCase() === role.toUpperCase()
    );
  };

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store user in state and localStorage
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Navigate to appropriate dashboard based on role
      if (data.user.role.toUpperCase() === 'MARKETING OPS') {
        router.push('/marketing-ops-finalized-commission');
      } else if (data.user.role.toUpperCase() === 'COMPLIANCE') {
        router.push('/compliance-checklist');
      } else if (data.user.role.toUpperCase() === 'ADMIN') {
        router.push('/compliance-checklist');
      } else {
        // Default for MARKETING role and any other roles
        router.push('/reports');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update Password function
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error('User not logged in');
    }
    
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          currentPassword,
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password update failed');
      }

      return data;
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      console.log('Logging out user...');
      // Clear user from state and localStorage
      setUser(null);
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    isLoading,
    login,
    logout,
    signOut: logout,
    updatePassword,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};