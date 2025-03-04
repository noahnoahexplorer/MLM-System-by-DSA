import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Add a GET method to provide a helpful error message
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Method not allowed', 
      message: 'Please use POST method with a JSON body containing username, password, role, and merchantId',
      example: {
        username: "username",
        password: "password",
        role: "MEMBER",
        merchantId: "merchant_id"
      }
    },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  try {
    // We'll rely on client-side auth instead of cookie verification
    
    const body = await request.json();
    const { username, password, role, merchantId } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['MARKETING', 'MARKETING OPS', 'COMPLIANCE', 'ADMIN'];
    if (role && !validRoles.includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const checkQuery = `
      SELECT COUNT(*) AS COUNT
      FROM DEV_DSA.PRESENTATION.USER_AUTH
      WHERE MEMBER_LOGIN = '${username}'
    `;

    const checkResult = await executeQuery(checkQuery);
    
    if (checkResult[0].COUNT > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate a unique member ID
    const memberId = uuidv4();

    // Default permissions based on role
    let permissions = '';
    
    switch(role ? role.toUpperCase() : 'MARKETING') {
      case 'MARKETING':
        permissions = 'marketing-ops-finalized-commission,members,reports';
        break;
      case 'MARKETING OPS':
        permissions = 'marketing-ops-finalized-commission,members,reports';
        break;
      case 'COMPLIANCE':
        permissions = 'compliance-checklist,exclusion-list,members,reports';
        break;
      case 'ADMIN':
        permissions = 'compliance-checklist,exclusion-list,marketing-ops-finalized-commission,members,reports,settings';
        break;
      default:
        permissions = 'members,reports';
    }

    // Insert the new user into Snowflake
    const insertQuery = `
      INSERT INTO DEV_DSA.PRESENTATION.USER_AUTH (
        MEMBER_ID,
        MEMBER_LOGIN,
        PASSWORD_HASH,
        ROLE,
        PERMISSIONS,
        MERCHANT_ID,
        CREATED_AT,
        UPDATED_AT
      ) VALUES (
        '${memberId}',
        '${username}',
        '${passwordHash}',
        '${role || 'Marketing'}',
        '${permissions}',
        '${merchantId || ''}',
        CURRENT_TIMESTAMP(),
        CURRENT_TIMESTAMP()
      )
    `;

    await executeQuery(insertQuery);

    return NextResponse.json({
      message: 'User registered successfully',
      userId: memberId
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 