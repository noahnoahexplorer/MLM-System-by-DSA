import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET() {
  try {
    const trendsQuery = `
      WITH WeeklyStats AS (
        SELECT 
          TO_CHAR(DATE(START_DATE), 'YYYY-MM-DD') as formatted_start_date,
          TO_CHAR(DATE(END_DATE), 'YYYY-MM-DD') as formatted_end_date,
          SUM(LOCAL_COMMISSION_AMOUNT) as total_commission,
          COUNT(DISTINCT MEMBER_LOGIN) as active_members
        FROM DEV_DSA.PRESENTATION.MLM_DAILY_COMMISSION
        WHERE START_DATE >= DATEADD(week, -8, DATE_TRUNC('WEEK', CURRENT_DATE()))
        GROUP BY START_DATE, END_DATE
        ORDER BY START_DATE DESC
      )
      SELECT 
        CONCAT(formatted_start_date, ' - ', formatted_end_date) as week,
        total_commission,
        active_members
      FROM WeeklyStats
      ORDER BY formatted_start_date ASC
    `;

    const trends = await executeQuery(trendsQuery);

    return NextResponse.json({ weeklyTrends: trends });
  } catch (error) {
    console.error('Error fetching commission trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commission trends' },
      { status: 500 }
    );
  }
} 