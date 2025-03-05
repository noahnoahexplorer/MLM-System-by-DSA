import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function verifyAuth(request: NextRequest) {
  // Get the token from cookies
  const token = cookies().get('auth_token')?.value;

  if (!token) {
    return {
      isAuthenticated: false,
      error: 'Not authenticated',
      user: null
    };
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      role: string;
      permissions: string;
      merchantId: string;
    };

    return {
      isAuthenticated: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        permissions: decoded.permissions ? decoded.permissions.split(',') : [],
        merchantId: decoded.merchantId
      }
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      error: 'Invalid token',
      user: null
    };
  }
}

export function requireAuth(handler: Function) {
  return async (request: NextRequest) => {
    const auth = await verifyAuth(request);
    
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return handler(request, auth.user);
  };
}

export function requireAdmin(handler: Function) {
  return async (request: NextRequest) => {
    const auth = await verifyAuth(request);
    
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (auth.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return handler(request, auth.user);
  };
} 