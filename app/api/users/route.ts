import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  try {
    // Since we're not using cookies, we'll rely on client-side auth
    // The client-side RoleGuard or AdminGuard will prevent unauthorized access
    
    // Query Snowflake for all users
    const query = `
      SELECT MEMBER_ID, MEMBER_LOGIN, ROLE
      FROM DEV_DSA.PRESENTATION.USER_AUTH
      ORDER BY MEMBER_LOGIN
    `;

    const users = await executeQuery(query);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 