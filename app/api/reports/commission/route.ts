import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const view = searchParams.get('view') || 'monthly'; // 'daily' or 'monthly'
    const compareMonths = parseInt(searchParams.get('compareMonths') || '12', 10); // Number of months for comparison

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    // Query for trends based on view (daily or monthly)
    const trendsQuery = view === 'daily' 
      ? `
        WITH DailyTrends AS (
          SELECT 
            START_DATE as REPORT_DATE,
            SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
            COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as UNIQUE_REFEREES,
            SUM(TOTAL_WIN_LOSS) as TOTAL_NGR
          FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
          WHERE 
            YEAR(START_DATE) = ${year}
            AND MONTH(START_DATE) = ${month}
          GROUP BY START_DATE
        )
        SELECT 
          TO_VARCHAR(REPORT_DATE, 'YYYY-MM-DD') as DATE,
          TOTAL_COMMISSION,
          UNIQUE_REFEREES,
          TOTAL_NGR
        FROM DailyTrends
        ORDER BY REPORT_DATE ASC
      `
      : `
        WITH MonthlyTrends AS (
          SELECT 
            DATE_TRUNC('MONTH', START_DATE) as REPORT_MONTH,
            SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
            COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as UNIQUE_REFEREES,
            SUM(TOTAL_WIN_LOSS) as TOTAL_NGR
          FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
          WHERE START_DATE >= DATEADD(month, -${compareMonths - 1}, DATE_TRUNC('MONTH', TO_DATE('${year}-${month.padStart(2, '0')}-01')))
          GROUP BY DATE_TRUNC('MONTH', START_DATE)
        )
        SELECT 
          TO_VARCHAR(REPORT_MONTH, 'YYYY-MM') as MONTH,
          TOTAL_COMMISSION,
          UNIQUE_REFEREES,
          TOTAL_NGR
        FROM MonthlyTrends
        ORDER BY REPORT_MONTH ASC
      `;

    // Enhanced report query to handle any number of levels
    const reportQuery = `
      WITH LevelStats AS (
        SELECT 
          DATE_TRUNC('MONTH', START_DATE) as REPORT_MONTH,
          RELATIVE_LEVEL,
          SUM(LOCAL_COMMISSION_AMOUNT) as LEVEL_COMMISSION,
          COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as LEVEL_REFEREES
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
        WHERE 
          YEAR(START_DATE) = ${year}
          AND MONTH(START_DATE) = ${month}
        GROUP BY DATE_TRUNC('MONTH', START_DATE), RELATIVE_LEVEL
      ),
      MonthlyStats AS (
        SELECT 
          DATE_TRUNC('MONTH', START_DATE) as REPORT_MONTH,
          SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
          COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as UNIQUE_REFEREES,
          SUM(TOTAL_DEPOSIT_AMOUNT) as TOTAL_DEPOSITS,
          SUM(TOTAL_VALID_TURNOVER) as TOTAL_TURNOVER,
          SUM(TOTAL_WIN_LOSS) as TOTAL_NGR
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
        WHERE 
          YEAR(START_DATE) = ${year}
          AND MONTH(START_DATE) = ${month}
        GROUP BY DATE_TRUNC('MONTH', START_DATE)
      ),
      ComparisonStats AS (
        SELECT 
          DATE_TRUNC('MONTH', START_DATE) as REPORT_MONTH,
          SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
          COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as UNIQUE_REFEREES
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
        WHERE 
          START_DATE >= DATEADD(month, -12, DATE_TRUNC('MONTH', TO_DATE('${year}-${month.padStart(2, '0')}-01')))
        GROUP BY DATE_TRUNC('MONTH', START_DATE)
      )
      SELECT 
        TO_VARCHAR(ms.REPORT_MONTH, 'YYYY-MM') as MONTH,
        ms.TOTAL_COMMISSION,
        ms.UNIQUE_REFEREES,
        ms.TOTAL_DEPOSITS,
        ms.TOTAL_TURNOVER,
        ms.TOTAL_NGR,
        ms.TOTAL_COMMISSION / NULLIF(ms.UNIQUE_REFEREES, 0) as AVG_COMMISSION,
        ARRAY_AGG(OBJECT_CONSTRUCT(
          'level', ls.RELATIVE_LEVEL,
          'commission', ls.LEVEL_COMMISSION,
          'referees', ls.LEVEL_REFEREES
        )) as LEVEL_BREAKDOWN
      FROM MonthlyStats ms
      LEFT JOIN LevelStats ls ON ms.REPORT_MONTH = ls.REPORT_MONTH
      GROUP BY 
        ms.REPORT_MONTH,
        ms.TOTAL_COMMISSION,
        ms.UNIQUE_REFEREES,
        ms.TOTAL_DEPOSITS,
        ms.TOTAL_TURNOVER,
        ms.TOTAL_NGR
    `;

    // Get month-by-month comparison data
    const comparisonQuery = `
      WITH MonthlyComparison AS (
        SELECT 
          DATE_TRUNC('MONTH', START_DATE) as REPORT_MONTH,
          SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
          COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as UNIQUE_REFEREES,
          SUM(TOTAL_DEPOSIT_AMOUNT) as TOTAL_DEPOSITS,
          SUM(TOTAL_VALID_TURNOVER) as TOTAL_TURNOVER,
          SUM(TOTAL_WIN_LOSS) as TOTAL_NGR
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
        WHERE 
          START_DATE >= DATEADD(month, -12, DATE_TRUNC('MONTH', TO_DATE('${year}-${month.padStart(2, '0')}-01')))
        GROUP BY DATE_TRUNC('MONTH', START_DATE)
      )
      SELECT 
        TO_VARCHAR(REPORT_MONTH, 'YYYY-MM') as MONTH,
        TOTAL_COMMISSION,
        UNIQUE_REFEREES,
        TOTAL_DEPOSITS,
        TOTAL_TURNOVER,
        TOTAL_NGR,
        TOTAL_COMMISSION / NULLIF(UNIQUE_REFEREES, 0) as AVG_COMMISSION
      FROM MonthlyComparison
      ORDER BY REPORT_MONTH ASC
    `;

    const [reportData, trendsData, comparisonData] = await Promise.all([
      executeQuery(reportQuery),
      executeQuery(trendsQuery),
      executeQuery(comparisonQuery)
    ]);

    const report = reportData[0] || null;
    
    // Process level breakdown with proper type definitions
    interface LevelData {
      level: number;
      commission: number;
      referees: number;
    }
    
    const levelBreakdown = report?.LEVEL_BREAKDOWN 
      ? JSON.parse(report.LEVEL_BREAKDOWN)
          .filter((level: any) => level.level !== null)
          .sort((a: LevelData, b: LevelData) => a.level - b.level)
      : [];

    return NextResponse.json({
      report: report ? {
        month: report.MONTH,
        totalCommission: report.TOTAL_COMMISSION || 0,
        uniqueReferees: report.UNIQUE_REFEREES || 0,
        averageCommission: report.AVG_COMMISSION || 0,
        totalNGR: report.TOTAL_NGR || 0,
        refereePerformance: {
          totalDeposit: report.TOTAL_DEPOSITS || 0,
          totalTurnover: report.TOTAL_TURNOVER || 0,
          totalWinLoss: report.TOTAL_NGR || 0
        },
        levelBreakdown: levelBreakdown
      } : null,
      trends: trendsData.map(trend => ({
        date: trend.DATE || trend.MONTH,
        totalCommission: trend.TOTAL_COMMISSION || 0,
        uniqueReferees: trend.UNIQUE_REFEREES || 0,
        totalNGR: trend.TOTAL_NGR || 0
      })),
      comparison: comparisonData.map(data => ({
        month: data.MONTH,
        totalCommission: data.TOTAL_COMMISSION || 0,
        uniqueReferees: data.UNIQUE_REFEREES || 0,
        totalDeposits: data.TOTAL_DEPOSITS || 0,
        totalTurnover: data.TOTAL_TURNOVER || 0,
        totalNGR: data.TOTAL_NGR || 0,
        averageCommission: data.AVG_COMMISSION || 0
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