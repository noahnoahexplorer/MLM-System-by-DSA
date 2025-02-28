import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberLogin = searchParams.get('memberLogin');

    if (!memberLogin) {
      return NextResponse.json(
        { error: 'Member login is required' },
        { status: 400 }
      );
    }

    const networkQuery = `
      WITH RECURSIVE NetworkHierarchy AS (
        -- Base case: Get the searched member
        SELECT 
          MEMBER_ID,
          MEMBER_LOGIN,
          RELATIVE_LEVEL,
          RELATIVE_LEVEL_REFEREE_LOGIN,
          LOCAL_COMMISSION_AMOUNT,
          TOTAL_DEPOSIT_AMOUNT,
          TOTAL_VALID_TURNOVER,
          TOTAL_WIN_LOSS,
          1 as LEVEL
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
        WHERE MEMBER_LOGIN = '${memberLogin}'
        
        UNION ALL
        
        -- Recursive case: Get all referrals
        SELECT 
          m.MEMBER_ID,
          m.MEMBER_LOGIN,
          m.RELATIVE_LEVEL,
          m.RELATIVE_LEVEL_REFEREE_LOGIN,
          m.LOCAL_COMMISSION_AMOUNT,
          m.TOTAL_DEPOSIT_AMOUNT,
          m.TOTAL_VALID_TURNOVER,
          m.TOTAL_WIN_LOSS,
          nh.LEVEL + 1
        FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION m
        INNER JOIN NetworkHierarchy nh 
          ON m.MEMBER_LOGIN = nh.RELATIVE_LEVEL_REFEREE_LOGIN
        WHERE m.RELATIVE_LEVEL_REFEREE_LOGIN IS NOT NULL
      )
      SELECT DISTINCT
        MEMBER_ID,
        MEMBER_LOGIN,
        RELATIVE_LEVEL_REFEREE_LOGIN as REFERRER_LOGIN,
        SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
        SUM(TOTAL_DEPOSIT_AMOUNT) as TOTAL_DEPOSIT,
        SUM(TOTAL_VALID_TURNOVER) as TOTAL_TURNOVER,
        SUM(TOTAL_WIN_LOSS) as TOTAL_NGR,
        LEVEL
      FROM NetworkHierarchy
      GROUP BY
        MEMBER_ID,
        MEMBER_LOGIN,
        RELATIVE_LEVEL_REFEREE_LOGIN,
        LEVEL
      ORDER BY LEVEL, MEMBER_LOGIN;
    `;

    const networkData = await executeQuery(networkQuery);
    return NextResponse.json({ network: networkData });
  } catch (error) {
    console.error('Error fetching network data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network data' },
      { status: 500 }
    );
  }
} 