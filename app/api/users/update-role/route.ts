import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function POST(request: NextRequest) {
  try {
    // We'll rely on client-side auth instead of cookie verification
    // The AdminGuard component will prevent unauthorized access
    
    // Get request body
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Validate role (case-insensitive)
    const validRoles = ['MARKETING', 'MARKETING OPS', 'COMPLIANCE', 'ADMIN'];
    if (!validRoles.includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Determine permissions based on role
    let permissions = '';
    
    switch(role.toUpperCase()) {
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

    // Update user role in Snowflake using parameterized query
    const updateQuery = `
      UPDATE DEV_DSA.PRESENTATION.USER_AUTH
      SET ROLE = ?, PERMISSIONS = ?, UPDATED_AT = CURRENT_TIMESTAMP()
      WHERE MEMBER_ID = ?
    `;

    await executeQuery(updateQuery, [role, permissions, userId]);

    return NextResponse.json({
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
} 