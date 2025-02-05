import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET() {
  try {
    const metricsQuery = `
      WITH CurrentWeek AS (
        SELECT 
          SUM(LOCAL_COMMISSION_AMOUNT) as weekly_commission,
          COUNT(DISTINCT MEMBER_LOGIN) as active_members,
          MAX(LOCAL_COMMISSION_AMOUNT) as top_commission
        FROM PROD_ALPHATEL.PRESENTATION.MLM_DAILY_COMMISSION 
        WHERE DATE(START_DATE) = DATE_TRUNC('WEEK', CURRENT_DATE())
      ),
      LastWeek AS (
        SELECT SUM(LOCAL_COMMISSION_AMOUNT) as last_week_commission
        FROM PROD_ALPHATEL.PRESENTATION.MLM_DAILY_COMMISSION 
        WHERE DATE(START_DATE) = DATEADD(week, -1, DATE_TRUNC('WEEK', CURRENT_DATE()))
      )
      SELECT 
        COALESCE(c.weekly_commission, 0) as weekly_commission,
        COALESCE(c.active_members, 0) as active_members,
        COALESCE(c.top_commission, 0) as top_commission,
        COALESCE(c.weekly_commission / NULLIF(c.active_members, 0), 0) as average_commission,
        COALESCE(((c.weekly_commission - l.last_week_commission) / NULLIF(l.last_week_commission, 0)) * 100, 0) as weekly_growth
      FROM CurrentWeek c
      CROSS JOIN LastWeek l
    `;

    const metrics = await executeQuery(metricsQuery);

    const result = metrics[0] || {
      weekly_commission: 0,
      weekly_growth: 0,
      active_members: 0,
      average_commission: 0,
      top_commission: 0
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
} 