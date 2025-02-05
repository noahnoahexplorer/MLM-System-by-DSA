import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET() {
  try {
    const commissionQuery = `
      SELECT 
        START_DATE,
        END_DATE,
        MEMBER_ID,
        MEMBER_LOGIN,
        MEMBER_CURRENCY,
        LOCAL_COMMISSION_AMOUNT as TOTAL_COMMISSION
      FROM DEV_DSA.PRESENTATION.MLM_DAILY_COMMISSION 
      ORDER BY START_DATE DESC, MEMBER_LOGIN
    `;
    
    const commissionData = await executeQuery(commissionQuery);
    
    return NextResponse.json({ commission: commissionData });
  } catch (error) {
    console.error('Error fetching commission data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commission data' },
      { status: 500 }
    );
  }
} 