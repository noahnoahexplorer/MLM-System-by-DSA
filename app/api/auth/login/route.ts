import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Add a GET method to provide a helpful error message
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Method not allowed', 
      message: 'Please use POST method with a JSON body containing username and password',
      example: {
        username: "your_username",
        password: "your_password"
      }
    },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Query Snowflake for the user
    const query = `
      SELECT MEMBER_ID, MEMBER_LOGIN, PASSWORD_HASH, ROLE, PERMISSIONS, MERCHANT_ID
      FROM DEV_DSA.PRESENTATION.USER_AUTH
      WHERE MEMBER_LOGIN = '${username}'
    `;

    const users = await executeQuery(query);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.PASSWORD_HASH);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        id: user.MEMBER_ID,
        username: user.MEMBER_LOGIN,
        role: user.ROLE,
        permissions: user.PERMISSIONS,
        merchantId: user.MERCHANT_ID
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set the auth token cookie - IMPORTANT: Make sure this is working
    const response = NextResponse.json({
      user: {
        id: user.MEMBER_ID,
        username: user.MEMBER_LOGIN,
        role: user.ROLE,
        permissions: user.PERMISSIONS ? user.PERMISSIONS.split(',') : [],
        merchantId: user.MERCHANT_ID
      },
      message: 'Login successful'
    });

    // Set cookie on the response object
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 