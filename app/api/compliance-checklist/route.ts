import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  try {
    console.log('Compliance API request received');
    
    // Get start and end dates from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const excludeZeroCommission = searchParams.get('excludeZeroCommission') === 'true';
    
    let exclusionCondition = '';
    if (excludeZeroCommission) {
      exclusionCondition = 'AND LOCAL_COMMISSION_AMOUNT > 0';
    }

    // Debug log to check parameters
    console.log('Compliance API params:', { startDate, endDate, excludeZeroCommission });

    // Add a limit to the query to test if it's a data volume issue
    const query = `
      SELECT 
        START_DATE,
        END_DATE,
        MERCHANT_ID,
        MEMBER_ID,
        MEMBER_NAME,
        MEMBER_LOGIN,
        MEMBER_CURRENCY,
        MEMBER_GROUP,
        MEMBER_DEPOSIT,
        RELATIVE_LEVEL,
        RELATIVE_LEVEL_REFEREE,
        RELATIVE_LEVEL_REFEREE_LOGIN,
        TOTAL_DEPOSIT_AMOUNT,
        TOTAL_WIN_LOSS,
        TOTAL_VALID_TURNOVER,
        BASE_TOTAL_VALID_TURNOVER,
        BASE_TOTAL_CLEAN_TURNOVER,
        BASE_TOTAL_CLEAN_WIN_LOSS,
        COMMISSION_RATE,
        BASE_COMMISSION_AMOUNT,
        GLOBAL_MULTIPLIER,
        LOCAL_COMMISSION_AMOUNT,
        SNOWFLAKE_LAST_MODIFIED
      FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION_DETAILS
      WHERE 1=1
      ${startDate ? `AND DATE(START_DATE) = '${startDate}'` : ''}
      ${endDate ? `AND DATE(END_DATE) = '${endDate}'` : ''}
      ${exclusionCondition}
      ORDER BY MEMBER_LOGIN
    `;
    
    console.log('Executing query:', query);
    
    try {
      console.log('Before executeQuery call');
      const complianceData = await executeQuery(query);
      console.log('After executeQuery call');
      console.log(`Query returned ${complianceData ? complianceData.length : 0} rows`);
      
      // In the GET function, make sure we're returning the correct data
      const excludedRefereesQuery = `
        SELECT REFEREE_LOGIN
        FROM DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_REFEREES_LIST
        WHERE IS_ACTIVE = TRUE
        AND (
          (START_DATE <= '${endDate}' AND END_DATE >= '${startDate}')
          OR (START_DATE BETWEEN '${startDate}' AND '${endDate}')
          OR (END_DATE BETWEEN '${startDate}' AND '${endDate}')
        )
      `;

      const excludedReferees = await executeQuery(excludedRefereesQuery);
      const excludedRefereeLogins = excludedReferees.map(row => row.REFEREE_LOGIN);

      // Return the data
      return NextResponse.json({
        compliance: complianceData,
        excludedReferees: excludedRefereeLogins,
        memberTotals: {}
      });
    } catch (queryError) {
      console.error('Error in query execution:', queryError);
      throw queryError;
    }
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data', details: error.message },
      { status: 500 }
    );
  }
}