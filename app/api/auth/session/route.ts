import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = cookies().get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated', message: 'No auth_token cookie found' },
        { status: 401 }
      );
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        username: string;
        role: string;
        permissions: string;
        merchantId: string;
      };

      // Return user info
      return NextResponse.json({
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
          permissions: decoded.permissions,
          merchantId: decoded.merchantId
        },
        debug: {
          tokenVerified: true,
          cookieFound: true
        }
      });
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      
      // Clear the invalid token
      cookies().set({
        name: 'auth_token',
        value: '',
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
        sameSite: 'lax'
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid or expired token', 
          message: jwtError instanceof Error ? jwtError.message : 'Token verification failed',
          debug: {
            tokenCleared: true,
            originalError: String(jwtError)
          }
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Session check failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 