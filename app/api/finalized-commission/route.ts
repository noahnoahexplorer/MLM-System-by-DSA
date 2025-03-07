import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  try {
    // Get start and end dates from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const regenerate = searchParams.get('regenerate') === 'true';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Check if we need to regenerate the finalized list
    if (regenerate) {
      // First, get the list of excluded referees for this period
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
      
      const excludedRefereesResult = await executeQuery(excludedRefereesQuery);
      const excludedReferees = excludedRefereesResult.map(row => row.REFEREE_LOGIN);
      
      // Build the exclusion condition
      let exclusionCondition = '';
      if (excludedReferees.length > 0) {
        exclusionCondition = `AND RELATIVE_LEVEL_REFEREE_LOGIN NOT IN ('${excludedReferees.join("','")}')`;
      }

      // Delete existing records for this period
      const deleteQuery = `
        DELETE FROM DEV_ALPHATEL.PRESENTATION.MLM_MKTOPS_LIST
        WHERE DATE(START_DATE) = '${startDate}'
        AND DATE(END_DATE) = '${endDate}'
      `;
      
      await executeQuery(deleteQuery);

      // Insert new records with exclusions applied
      const insertQuery = `
        INSERT INTO DEV_ALPHATEL.PRESENTATION.MLM_MKTOPS_LIST (
          START_DATE,
          END_DATE,
          MEMBER_ID,
          MEMBER_LOGIN,
          MEMBER_CURRENCY,
          TOTAL_COMMISSION,
          GENERATION_DATE
        )
        SELECT 
          START_DATE,
          END_DATE,
          MEMBER_ID,
          MEMBER_LOGIN,
          MEMBER_CURRENCY,
          SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
          CURRENT_TIMESTAMP() as GENERATION_DATE
        FROM PROD_ALPHATEL.PRESENTATION.MLM_DAILY_COMMISSION
        WHERE DATE(START_DATE) = '${startDate}'
        AND DATE(END_DATE) = '${endDate}'
        AND IS_LATEST = 'TRUE'
        ${exclusionCondition}
        GROUP BY
          START_DATE,
          END_DATE,
          MEMBER_ID,
          MEMBER_LOGIN,
          MEMBER_CURRENCY
      `;
      
      await executeQuery(insertQuery);
    }

    // Fetch the finalized commission data
    const finalizedQuery = `
      SELECT 
        START_DATE,
        END_DATE,
        MEMBER_ID,
        MEMBER_LOGIN,
        MEMBER_CURRENCY,
        TOTAL_COMMISSION,
        GENERATION_DATE
      FROM DEV_ALPHATEL.PRESENTATION.MLM_MKTOPS_LIST
      WHERE DATE(START_DATE) = '${startDate}'
      AND DATE(END_DATE) = '${endDate}'
      ORDER BY TOTAL_COMMISSION DESC
    `;
    
    const finalizedData = await executeQuery(finalizedQuery);
    
    // Get count of excluded referees
    const excludedCountQuery = `
      SELECT COUNT(*) as EXCLUDED_COUNT
      FROM DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_REFEREES_LIST
      WHERE IS_ACTIVE = TRUE
      AND (
        (START_DATE <= '${endDate}' AND END_DATE >= '${startDate}')
        OR (START_DATE BETWEEN '${startDate}' AND '${endDate}')
        OR (END_DATE BETWEEN '${startDate}' AND '${endDate}')
      )
    `;
    
    const excludedCountResult = await executeQuery(excludedCountQuery);
    const excludedCount = excludedCountResult[0]?.EXCLUDED_COUNT || 0;
    
    // In the GET function, add this query to get submission info
    const submissionInfoQuery = `
      SELECT 
        SUBMITTED_BY,
        SUBMISSION_DATE,
        EXCLUDED_REFEREES_COUNT
      FROM DEV_ALPHATEL.PRESENTATION.MLM_SUBMISSION_HISTORY
      WHERE DATE(START_DATE) = '${startDate}'
      AND DATE(END_DATE) = '${endDate}'
      ORDER BY SUBMISSION_DATE DESC
      LIMIT 1
    `;

    const submissionInfoResult = await executeQuery(submissionInfoQuery);
    const submissionInfo = submissionInfoResult.length > 0 ? {
      submittedBy: submissionInfoResult[0].SUBMITTED_BY,
      submissionDate: submissionInfoResult[0].SUBMISSION_DATE,
      excludedRefereesCount: submissionInfoResult[0].EXCLUDED_REFEREES_COUNT,
      complianceVerificationDate: submissionInfoResult[0].SUBMISSION_DATE
    } : null;
    
    return NextResponse.json({ 
      commission: finalizedData,
      excludedCount,
      generationDate: finalizedData.length > 0 ? finalizedData[0].GENERATION_DATE : null,
      submissionInfo
    });
  } catch (error) {
    console.error('Error fetching finalized commission data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finalized commission data' },
      { status: 500 }
    );
  }
} 