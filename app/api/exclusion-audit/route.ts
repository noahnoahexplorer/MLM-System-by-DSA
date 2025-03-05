import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

// Get audit logs for exclusion operations
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refereeLogin = searchParams.get('referee');
  const limit = searchParams.get('limit') || '100';
  
  try {
    let whereClause = '';
    if (refereeLogin) {
      whereClause = `WHERE REFEREE_LOGIN = '${refereeLogin}'`;
    }
    
    const query = `
      SELECT 
        ID,
        REFEREE_LOGIN,
        ACTION_TYPE,
        ACTION_BY,
        ACTION_DETAILS,
        PREVIOUS_STATE,
        NEW_STATE,
        ACTION_DATE
      FROM DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_AUDIT_LOG
      ${whereClause}
      ORDER BY ACTION_DATE DESC
      LIMIT ${limit}
    `;
    
    const auditLogs = await executeQuery(query);
    
    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 