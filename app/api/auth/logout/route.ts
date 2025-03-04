import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Clear the auth token cookie
    cookies().set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immediately
      sameSite: 'lax'
    });

    // Also try deleting the cookie as a fallback
    cookies().delete('auth_token');

    return NextResponse.json({ 
      message: 'Logged out successfully',
      debug: {
        cookieCleared: true
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        error: 'Logout failed', 
        message: error instanceof Error ? error.message : 'Unknown error during logout',
        debug: {
          errorType: typeof error,
          errorString: String(error)
        }
      },
      { status: 500 }
    );
  }
} 