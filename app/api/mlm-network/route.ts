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
        RELATIVE_LEVEL,
        RELATIVE_LEVEL_REFEREE_LOGIN,
        SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
        SUM(CASE WHEN RELATIVE_LEVEL_REFEREE IS NOT NULL THEN TOTAL_DEPOSIT_AMOUNT ELSE 0 END) as REFEREE_DEPOSIT,
        SUM(CASE WHEN RELATIVE_LEVEL_REFEREE IS NOT NULL THEN TOTAL_VALID_TURNOVER ELSE 0 END) as REFEREE_TURNOVER,
        SUM(CASE WHEN RELATIVE_LEVEL_REFEREE IS NOT NULL THEN TOTAL_WIN_LOSS ELSE 0 END) as REFEREE_WIN_LOSS
      FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION 
      WHERE RELATIVE_LEVEL_REFEREE_LOGIN IS NOT NULL
      GROUP BY 
        START_DATE,
        END_DATE,
        MEMBER_ID,
        MEMBER_LOGIN,
        MEMBER_CURRENCY,
        RELATIVE_LEVEL,
        RELATIVE_LEVEL_REFEREE_LOGIN
      ORDER BY START_DATE DESC
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