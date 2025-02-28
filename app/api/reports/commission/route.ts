import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    const trendsQuery = `
      WITH MonthlyTrends AS (
        SELECT 
          DATE_TRUNC('MONTH', START_DATE) as REPORT_MONTH,
          SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
          COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as UNIQUE_REFEREES
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
        WHERE START_DATE >= DATEADD(month, -11, DATE_TRUNC('MONTH', CURRENT_DATE()))
        GROUP BY DATE_TRUNC('MONTH', START_DATE)
      )
      SELECT 
        TO_VARCHAR(REPORT_MONTH, 'YYYY-MM') as MONTH,
        TOTAL_COMMISSION,
        UNIQUE_REFEREES
      FROM MonthlyTrends
      ORDER BY REPORT_MONTH ASC
    `;

    const reportQuery = `
      WITH MonthlyStats AS (
        SELECT 
          DATE_TRUNC('MONTH', START_DATE) as REPORT_MONTH,
          SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
          SUM(CASE WHEN RELATIVE_LEVEL = 1 THEN LOCAL_COMMISSION_AMOUNT ELSE 0 END) as LEVEL1_COMMISSION,
          SUM(CASE WHEN RELATIVE_LEVEL = 2 THEN LOCAL_COMMISSION_AMOUNT ELSE 0 END) as LEVEL2_COMMISSION,
          SUM(CASE WHEN RELATIVE_LEVEL = 3 THEN LOCAL_COMMISSION_AMOUNT ELSE 0 END) as LEVEL3_COMMISSION,
          COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as UNIQUE_REFEREES,
          SUM(TOTAL_DEPOSIT_AMOUNT) as TOTAL_DEPOSITS,
          SUM(TOTAL_VALID_TURNOVER) as TOTAL_TURNOVER,
          SUM(TOTAL_WIN_LOSS) as TOTAL_NGR,
          COUNT(DISTINCT CASE WHEN RELATIVE_LEVEL = 1 THEN RELATIVE_LEVEL_REFEREE_LOGIN END) as LEVEL1_REFEREES,
          COUNT(DISTINCT CASE WHEN RELATIVE_LEVEL = 2 THEN RELATIVE_LEVEL_REFEREE_LOGIN END) as LEVEL2_REFEREES,
          COUNT(DISTINCT CASE WHEN RELATIVE_LEVEL = 3 THEN RELATIVE_LEVEL_REFEREE_LOGIN END) as LEVEL3_REFEREES
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
        WHERE 
          YEAR(START_DATE) = ${year}
          AND MONTH(START_DATE) = ${month}
        GROUP BY DATE_TRUNC('MONTH', START_DATE)
      )
      SELECT 
        TO_VARCHAR(REPORT_MONTH, 'YYYY-MM') as MONTH,
        TOTAL_COMMISSION,
        LEVEL1_COMMISSION,
        LEVEL2_COMMISSION,
        LEVEL3_COMMISSION,
        UNIQUE_REFEREES,
        TOTAL_DEPOSITS,
        TOTAL_TURNOVER,
        TOTAL_NGR,
        LEVEL1_REFEREES,
        LEVEL2_REFEREES,
        LEVEL3_REFEREES,
        TOTAL_COMMISSION / NULLIF(UNIQUE_REFEREES, 0) as AVG_COMMISSION
      FROM MonthlyStats
    `;

    const [reportData, trendsData] = await Promise.all([
      executeQuery(reportQuery),
      executeQuery(trendsQuery)
    ]);

    const report = reportData[0] || null;

    return NextResponse.json({
      report: report ? {
        month: report.MONTH,
        totalCommission: report.TOTAL_COMMISSION,
        level1Commission: report.LEVEL1_COMMISSION,
        level2Commission: report.LEVEL2_COMMISSION,
        level3Commission: report.LEVEL3_COMMISSION,
        uniqueReferees: report.UNIQUE_REFEREES,
        level1Referees: report.LEVEL1_REFEREES,
        level2Referees: report.LEVEL2_REFEREES,
        level3Referees: report.LEVEL3_REFEREES,
        averageCommission: report.AVG_COMMISSION,
        totalNGR: report.TOTAL_NGR,
        refereePerformance: {
          totalDeposit: report.TOTAL_DEPOSITS,
          totalTurnover: report.TOTAL_TURNOVER,
          totalWinLoss: report.TOTAL_NGR
        }
      } : null,
      trends: trendsData.map(trend => ({
        month: trend.MONTH,
        totalCommission: trend.TOTAL_COMMISSION,
        uniqueReferees: trend.UNIQUE_REFEREES || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching commission report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commission report' },
      { status: 500 }
    );
  }
} 