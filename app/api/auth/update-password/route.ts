import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';
import bcrypt from 'bcryptjs';

// Add a GET method to provide a helpful error message
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Method not allowed', 
      message: 'Please use POST method with a JSON body containing username, currentPassword, and newPassword',
      example: {
        username: "your_username",
        currentPassword: "your_current_password",
        newPassword: "your_new_password"
      }
    },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, currentPassword, newPassword } = body;

    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Username, current password, and new password are required' },
        { status: 400 }
      );
    }

    // Query Snowflake for the user
    const query = `
      SELECT MEMBER_ID, MEMBER_LOGIN, PASSWORD_HASH
      FROM DEV_DSA.PRESENTATION.USER_AUTH
      WHERE MEMBER_LOGIN = '${username}'
    `;

    const users = await executeQuery(query);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.PASSWORD_HASH);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash the new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the database
    const updateQuery = `
      UPDATE DEV_DSA.PRESENTATION.USER_AUTH
      SET PASSWORD_HASH = '${newPasswordHash}', UPDATED_AT = CURRENT_TIMESTAMP()
      WHERE MEMBER_ID = '${user.MEMBER_ID}'
    `;

    await executeQuery(updateQuery);

    return NextResponse.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 