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
          FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION_DETAILS
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
            DATE_TRUNC('MONTH', START_DATE) as REPORT_DATE,
            SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
            COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as UNIQUE_REFEREES,
            SUM(TOTAL_WIN_LOSS) as TOTAL_NGR
          FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION_DETAILS
          WHERE 
            YEAR(START_DATE) = ${year}
          GROUP BY DATE_TRUNC('MONTH', START_DATE)
        )
        SELECT 
          TO_VARCHAR(REPORT_DATE, 'YYYY-MM') as MONTH,
          TOTAL_COMMISSION,
          UNIQUE_REFEREES,
          TOTAL_NGR
        FROM MonthlyTrends
        ORDER BY REPORT_DATE ASC
      `;

    // Query for the specific month's report
    const reportQuery = `
      WITH MonthlyReport AS (
        SELECT 
          TO_VARCHAR(DATE_TRUNC('MONTH', START_DATE), 'YYYY-MM') as MONTH,
          SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
          COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as UNIQUE_REFEREES,
          SUM(TOTAL_DEPOSIT_AMOUNT) as TOTAL_DEPOSITS,
          SUM(TOTAL_VALID_TURNOVER) as TOTAL_TURNOVER,
          SUM(TOTAL_WIN_LOSS) as TOTAL_NGR
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION_DETAILS
        WHERE 
          YEAR(START_DATE) = ${year}
          AND MONTH(START_DATE) = ${month}
        GROUP BY DATE_TRUNC('MONTH', START_DATE)
      ),
      LevelBreakdown AS (
        SELECT 
          RELATIVE_LEVEL as LEVEL,
          SUM(LOCAL_COMMISSION_AMOUNT) as COMMISSION,
          COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as REFEREES
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION_DETAILS
        WHERE 
          YEAR(START_DATE) = ${year}
          AND MONTH(START_DATE) = ${month}
          AND RELATIVE_LEVEL IS NOT NULL
        GROUP BY RELATIVE_LEVEL
      )
      SELECT 
        r.MONTH,
        r.TOTAL_COMMISSION,
        r.UNIQUE_REFEREES,
        r.TOTAL_COMMISSION / NULLIF(r.UNIQUE_REFEREES, 0) as AVG_COMMISSION,
        r.TOTAL_DEPOSITS,
        r.TOTAL_TURNOVER,
        r.TOTAL_NGR,
        (
          SELECT ARRAY_AGG(OBJECT_CONSTRUCT('level', LEVEL, 'commission', COMMISSION, 'referees', REFEREES))
          FROM LevelBreakdown
        ) as LEVEL_BREAKDOWN
      FROM MonthlyReport r
    `;

    // Query for comparison data (last X months)
    const comparisonQuery = `
      WITH MonthlyComparison AS (
        SELECT 
          DATE_TRUNC('MONTH', START_DATE) as REPORT_DATE,
          TO_VARCHAR(DATE_TRUNC('MONTH', START_DATE), 'YYYY-MM') as MONTH,
          SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
          COUNT(DISTINCT RELATIVE_LEVEL_REFEREE_LOGIN) as UNIQUE_REFEREES,
          SUM(TOTAL_DEPOSIT_AMOUNT) as TOTAL_DEPOSITS,
          SUM(TOTAL_VALID_TURNOVER) as TOTAL_TURNOVER,
          SUM(TOTAL_WIN_LOSS) as TOTAL_NGR
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION_DETAILS
        WHERE 
          REPORT_DATE >= DATEADD(MONTH, -${compareMonths}, DATE_TRUNC('MONTH', TO_DATE('${year}-${month}-01')))
          AND REPORT_DATE <= DATE_TRUNC('MONTH', TO_DATE('${year}-${month}-01'))
        GROUP BY DATE_TRUNC('MONTH', START_DATE)
      )
      SELECT 
        MONTH,
        TOTAL_COMMISSION,
        UNIQUE_REFEREES,
        TOTAL_COMMISSION / NULLIF(UNIQUE_REFEREES, 0) as AVG_COMMISSION,
        TOTAL_DEPOSITS,
        TOTAL_TURNOVER,
        TOTAL_NGR
      FROM MonthlyComparison
      ORDER BY REPORT_DATE ASC
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
    
    // Fix: Check if LEVEL_BREAKDOWN is already an object before parsing
    const levelBreakdown = report?.LEVEL_BREAKDOWN 
      ? (typeof report.LEVEL_BREAKDOWN === 'string' 
          ? JSON.parse(report.LEVEL_BREAKDOWN)
          : report.LEVEL_BREAKDOWN)
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