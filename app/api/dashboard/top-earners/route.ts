import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET() {
  try {
    const topEarnersQuery = `
      WITH CurrentWeek AS (
        SELECT 
          MEMBER_LOGIN,
          SUM(LOCAL_COMMISSION_AMOUNT) as current_commission
        FROM DEV_DSA.PRESENTATION.MLM_DAILY_COMMISSION 
        WHERE DATE(START_DATE) = DATE_TRUNC('WEEK', CURRENT_DATE())
        GROUP BY MEMBER_LOGIN
      ),
      LastWeek AS (
        SELECT 
          MEMBER_LOGIN,
          SUM(LOCAL_COMMISSION_AMOUNT) as last_commission
        FROM DEV_DSA.PRESENTATION.MLM_DAILY_COMMISSION 
        WHERE DATE(START_DATE) = DATEADD(week, -1, DATE_TRUNC('WEEK', CURRENT_DATE()))
        GROUP BY MEMBER_LOGIN
      )
      SELECT 
        c.MEMBER_LOGIN as memberLogin,
        c.current_commission as commission,
        COALESCE(((c.current_commission - l.last_commission) / NULLIF(l.last_commission, 0)) * 100, 0) as growth
      FROM CurrentWeek c
      LEFT JOIN LastWeek l ON c.MEMBER_LOGIN = l.MEMBER_LOGIN
      ORDER BY c.current_commission DESC
      LIMIT 5
    `;

    const topEarners = await executeQuery(topEarnersQuery);

    return NextResponse.json({ topEarners });
  } catch (error) {
    console.error('Error fetching top earners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top earners' },
      { status: 500 }
    );
  }
} 