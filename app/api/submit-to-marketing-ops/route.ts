import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, endDate, submittedBy, submissionDate } = body;
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }
    
    // Check if already submitted
    const checkQuery = `
      SELECT COUNT(*) as SUBMISSION_COUNT
      FROM DEV_ALPHATEL.PRESENTATION.MLM_MKTOPS_LIST
      WHERE DATE(START_DATE) = '${startDate}'
      AND DATE(END_DATE) = '${endDate}'
    `;
    
    const checkResult = await executeQuery(checkQuery);
    if (checkResult[0]?.SUBMISSION_COUNT > 0) {
      return NextResponse.json(
        { error: 'This period has already been submitted to Marketing Ops' },
        { status: 400 }
      );
    }
    
    // Get the list of excluded referees for this period
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
    
    // Insert new records with exclusions applied
    const insertQuery = `
      INSERT INTO DEV_ALPHATEL.PRESENTATION.MLM_MKTOPS_LIST (
        START_DATE,
        END_DATE,
        MEMBER_ID,
        MEMBER_LOGIN,
        MEMBER_CURRENCY,
        TOTAL_COMMISSION,
        GENERATION_DATE,
        SUBMITTED_BY,
        VERIFIED_BY_COMPLIANCE
      )
      SELECT 
        START_DATE,
        END_DATE,
        MEMBER_ID,
        MEMBER_LOGIN,
        MEMBER_CURRENCY,
        SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
        CURRENT_TIMESTAMP() as GENERATION_DATE,
        '${submittedBy}' as SUBMITTED_BY,
        TRUE as VERIFIED_BY_COMPLIANCE
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
    
    // Also create a submission record to track when and who submitted
    const submissionRecordQuery = `
      INSERT INTO DEV_ALPHATEL.PRESENTATION.MLM_SUBMISSION_HISTORY (
        START_DATE,
        END_DATE,
        SUBMITTED_BY,
        SUBMISSION_DATE,
        EXCLUDED_REFEREES_COUNT
      )
      VALUES (
        '${startDate}',
        '${endDate}',
        '${submittedBy}',
        CURRENT_TIMESTAMP(),
        ${excludedReferees.length}
      )
    `;
    
    await executeQuery(submissionRecordQuery);
    
    return NextResponse.json({ 
      success: true,
      message: 'Data successfully submitted to Marketing Ops',
      excludedRefereesCount: excludedReferees.length
    });
  } catch (error) {
    console.error('Error submitting to Marketing Ops:', error);
    return NextResponse.json(
      { error: 'Failed to submit data to Marketing Ops' },
      { status: 500 }
    );
  }
} 