import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { executeQuery } from '@/lib/snowflake';

async function handler(request: NextRequest, user: any) {
  try {
    // Get admin dashboard data
    const query = `
      SELECT 
        COUNT(*) as TOTAL_USERS,
        SUM(CASE WHEN ROLE = 'ADMIN' THEN 1 ELSE 0 END) as ADMIN_USERS,
        SUM(CASE WHEN ROLE = 'MARKETING' THEN 1 ELSE 0 END) as MARKETING_USERS,
        SUM(CASE WHEN ROLE = 'COMPLIANCE' THEN 1 ELSE 0 END) as COMPLIANCE_USERS
      FROM DEV_DSA.PRESENTATION.USER_AUTH
    `;
    
    const result = await executeQuery(query);
    
    return NextResponse.json({ 
      stats: result[0],
      currentUser: user
    });
  } catch (error) {
    console.error('Error in admin API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(handler); 