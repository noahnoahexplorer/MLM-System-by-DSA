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

    if (!submittedBy || submittedBy.trim() === '') {
      return NextResponse.json(
        { error: 'Checker name is required' },
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
    
    // Get the list of excluded users for this period (affects both referees and referrers)
    const excludedUsersQuery = `
      SELECT REFEREE_LOGIN
      FROM DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_REFEREES_LIST
      WHERE IS_ACTIVE = TRUE
      AND (
        (START_DATE <= '${endDate}' AND END_DATE >= '${startDate}')
        OR (START_DATE BETWEEN '${startDate}' AND '${endDate}')
        OR (END_DATE BETWEEN '${startDate}' AND '${endDate}')
      )
    `;
    
    const excludedUsersResult = await executeQuery(excludedUsersQuery);
    const excludedUsers = excludedUsersResult.map(row => row.REFEREE_LOGIN);
    
    // Build the exclusion condition - checking both referee and referrer
    let exclusionCondition = '';
    if (excludedUsers.length > 0) {
      // Exclude records where either:
      // 1. The referee is in the exclusion list
      // 2. The referrer (MEMBER_LOGIN) is in the exclusion list
      exclusionCondition = `
        AND (
          RELATIVE_LEVEL_REFEREE_LOGIN NOT IN ('${excludedUsers.join("','")}')
          AND
          MEMBER_LOGIN NOT IN ('${excludedUsers.join("','")}')
        )
      `;
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
        ${excludedUsers.length}
      )
    `;
    
    await executeQuery(submissionRecordQuery);
    
    // Add entry to the audit log table
    const auditLogQuery = `
      INSERT INTO DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_AUDIT_LOG (
        REFEREE_LOGIN,
        ACTION_TYPE,
        ACTION_BY,
        ACTION_DETAILS,
        PREVIOUS_STATE,
        NEW_STATE,
        ACTION_DATE
      )
      VALUES (
        'system', -- Using 'system' as this is not specific to a referee
        'SUBMIT',
        '${submittedBy}',
        'Submitted compliance data to Marketing Ops for period ${startDate} to ${endDate} with ${excludedUsers.length} excluded users (as both referrers and referees)',
        'Not submitted',
        'Submitted to Marketing Ops',
        CURRENT_TIMESTAMP()
      )
    `;
    
    await executeQuery(auditLogQuery);
    
    return NextResponse.json({ 
      success: true,
      message: 'Data successfully submitted to Marketing Ops',
      excludedUsersCount: excludedUsers.length
    });
  } catch (error) {
    console.error('Error submitting to Marketing Ops:', error);
    return NextResponse.json(
      { error: 'Failed to submit data to Marketing Ops' },
      { status: 500 }
    );
  }
} 