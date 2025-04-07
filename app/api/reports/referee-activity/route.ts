import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const compareMonths = parseInt(searchParams.get('compareMonths') || '12', 10); // Number of months for comparison
    
    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    // Format dates for filtering
    const startDate = `${parseInt(year) - 1}-${month.padStart(2, '0')}-01 00:00:00.000`; // Start from 1 year ago
    const endDate = month === '12' 
      ? `${parseInt(year) + 1}-01-01 00:00:00.000` 
      : `${year}-${(parseInt(month) + 1).toString().padStart(2, '0')}-01 00:00:00.000`;

    // Query for monthly aggregated data
    const monthlyAggregateQuery = `
      SELECT 
        DATE_TRUNC('MONTH', DATE) as MONTH_DATE,
        TO_VARCHAR(DATE_TRUNC('MONTH', DATE), 'YYYY-MM') as MONTH,
        SUM(TOTAL_DEPOSIT) as TOTAL_DEPOSIT,
        SUM(TOTAL_WITHDRAWAL) as TOTAL_WITHDRAWAL,
        SUM(TOTAL_BONUS_AMOUNT) as TOTAL_BONUS_AMOUNT,
        SUM(TOTAL_REWARD) as TOTAL_REWARD,
        SUM(TOTAL_VALID_TURNOVER) as TOTAL_VALID_TURNOVER,
        SUM(NGR) as NGR,
        COUNT(DISTINCT REFEREE_ID) as ACTIVE_REFEREES
      FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_REFEREE_DAILY_ACTIVITY
      WHERE 
        DATE >= TO_TIMESTAMP('${startDate}')
        AND DATE < TO_TIMESTAMP('${endDate}')
      GROUP BY DATE_TRUNC('MONTH', DATE), TO_VARCHAR(DATE_TRUNC('MONTH', DATE), 'YYYY-MM')
      ORDER BY MONTH_DATE DESC
      LIMIT ${compareMonths}
    `;

    const monthlyData = await executeQuery(monthlyAggregateQuery);

    return NextResponse.json({
      monthly: monthlyData.map(data => ({
        month: data.MONTH,
        monthDate: data.MONTH_DATE,
        totalDeposit: data.TOTAL_DEPOSIT || 0,
        totalWithdrawal: data.TOTAL_WITHDRAWAL || 0,
        totalBonusAmount: data.TOTAL_BONUS_AMOUNT || 0,
        totalReward: data.TOTAL_REWARD || 0,
        totalValidTurnover: data.TOTAL_VALID_TURNOVER || 0,
        ngr: data.NGR || 0,
        activeReferees: data.ACTIVE_REFEREES || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching referee activity data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referee activity data' },
      { status: 500 }
    );
  }
} 