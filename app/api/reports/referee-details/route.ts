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

    // Format dates for the start and end of the month
    const startDate = `${year}-${month.padStart(2, '0')}-01 00:00:00.000`;
    const endDate = month === '12' 
      ? `${parseInt(year) + 1}-01-01 00:00:00.000` 
      : `${year}-${(parseInt(month) + 1).toString().padStart(2, '0')}-01 00:00:00.000`;

    // Query for individual referee data for the month
    const refereeQuery = `
      SELECT 
        REFEREE_ID,
        REFEREE_LOGIN,
        SUM(TOTAL_DEPOSIT) as TOTAL_DEPOSIT,
        SUM(TOTAL_WITHDRAWAL) as TOTAL_WITHDRAWAL,
        SUM(TOTAL_BONUS_AMOUNT) as TOTAL_BONUS_AMOUNT,
        SUM(TOTAL_REWARD) as TOTAL_REWARD,
        SUM(TOTAL_VALID_TURNOVER) as TOTAL_VALID_TURNOVER,
        SUM(NGR) as NGR
      FROM (
        SELECT 
          DATE,
          REFEREE_ID,
          REFEREE_LOGIN,
          TOTAL_DEPOSIT,
          TOTAL_WITHDRAWAL,
          TOTAL_BONUS_AMOUNT,
          TOTAL_REWARD,
          TOTAL_VALID_TURNOVER,
          NGR
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_REFEREE_DAILY_ACTIVITY
        WHERE 
          DATE >= TO_TIMESTAMP('${startDate}')
          AND DATE < TO_TIMESTAMP('${endDate}')
      ) as DAILY_DATA
      GROUP BY REFEREE_ID, REFEREE_LOGIN
      ORDER BY NGR DESC
    `;

    const refereeData = await executeQuery(refereeQuery);

    return NextResponse.json({
      referees: refereeData.map(data => ({
        refereeId: data.REFEREE_ID,
        refereeLogin: data.REFEREE_LOGIN,
        totalDeposit: data.TOTAL_DEPOSIT || 0,
        totalWithdrawal: data.TOTAL_WITHDRAWAL || 0,
        totalBonusAmount: data.TOTAL_BONUS_AMOUNT || 0,
        totalReward: data.TOTAL_REWARD || 0,
        totalValidTurnover: data.TOTAL_VALID_TURNOVER || 0,
        ngr: data.NGR || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching referee details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referee details' },
      { status: 500 }
    );
  }
} 