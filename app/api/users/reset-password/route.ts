import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userQuery = `
      SELECT MEMBER_ID, MEMBER_LOGIN
      FROM DEV_DSA.PRESENTATION.USER_AUTH
      WHERE MEMBER_ID = '${userId}'
    `;

    const users = await executeQuery(userQuery);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash the new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the database
    const updateQuery = `
      UPDATE DEV_DSA.PRESENTATION.USER_AUTH
      SET PASSWORD_HASH = '${newPasswordHash}', UPDATED_AT = CURRENT_TIMESTAMP()
      WHERE MEMBER_ID = '${userId}'
    `;

    await executeQuery(updateQuery);

    return NextResponse.json({
      message: 'Password reset successfully',
      username: users[0].MEMBER_LOGIN
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
} 