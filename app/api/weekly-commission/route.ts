import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  try {
    // Get start and end dates from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const commissionQuery = `
      SELECT 
        START_DATE,
        END_DATE,
        MEMBER_ID,
        MEMBER_LOGIN,
        MEMBER_CURRENCY,
        LOCAL_COMMISSION_AMOUNT as TOTAL_COMMISSION
      FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION 
      WHERE 1=1
      ${startDate ? `AND DATE(START_DATE) = '${startDate}'` : ''}
      ${endDate ? `AND DATE(END_DATE) = '${endDate}'` : ''}
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