import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

// Get all excluded users (both referrers and referees)
export async function GET() {
  try {
    // First, get the basic exclusion list
    const query = `
      SELECT 
        e.ID,
        e.REFEREE_LOGIN,
        e.EXCLUDED_BY,
        e.EXCLUSION_REASON,
        e.START_DATE,
        e.END_DATE,
        e.EXCLUSION_DATE,
        e.IS_ACTIVE
      FROM DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_REFEREES_LIST e
      ORDER BY e.EXCLUSION_DATE DESC
    `;
    
    const exclusions = await executeQuery(query);
    
    // Then, get the referrer information separately
    const referrerQuery = `
      SELECT DISTINCT
        RELATIVE_LEVEL_REFEREE_LOGIN as REFEREE_LOGIN,
        MEMBER_LOGIN as REFERRER_LOGIN
      FROM PROD_ALPHATEL.PRESENTATION.MLM_DAILY_COMMISSION
      WHERE RELATIVE_LEVEL_REFEREE_LOGIN IN (${exclusions.map(e => `'${e.REFEREE_LOGIN}'`).join(',') || "''"})
    `;
    
    // Only run the second query if we have exclusions
    let referrers = [];
    if (exclusions.length > 0) {
      referrers = await executeQuery(referrerQuery);
    }
    
    // Create a map of referee to referrer
    const referrerMap: Record<string, string> = {};
    referrers.forEach(r => {
      if (r.REFEREE_LOGIN) {
        referrerMap[r.REFEREE_LOGIN] = r.REFERRER_LOGIN;
      }
    });
    
    // Combine the data
    const combinedExclusions = exclusions.map(exclusion => ({
      ...exclusion,
      REFERRER_LOGIN: exclusion.REFEREE_LOGIN && referrerMap[exclusion.REFEREE_LOGIN] || null
    }));
    
    return NextResponse.json({ exclusions: combinedExclusions });
  } catch (error) {
    console.error('Error fetching exclusion list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exclusion list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Add a new user to exclusion list (affects both as referrer and referee)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refereeLogin, excludedBy, exclusionReason, startDate, endDate } = body;
    
    if (!refereeLogin || !excludedBy || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate that the user login exists in the system
    const validateUserQuery = `
      SELECT COUNT(*) AS USER_COUNT
      FROM PROD_ALPHATEL.PRESENTATION.MLM_DAILY_COMMISSION
      WHERE RELATIVE_LEVEL_REFEREE_LOGIN = '${refereeLogin}' OR MEMBER_LOGIN = '${refereeLogin}'
    `;
    
    const userValidation = await executeQuery(validateUserQuery);
    if (userValidation[0]?.USER_COUNT === 0) {
      return NextResponse.json(
        { error: 'User login does not exist in the system' },
        { status: 400 }
      );
    }
    
    // Check if there's already an exclusion for this user that overlaps with the date range
    const checkOverlapQuery = `
      SELECT COUNT(*) AS OVERLAP_COUNT
      FROM DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_REFEREES_LIST
      WHERE REFEREE_LOGIN = '${refereeLogin}'
      AND IS_ACTIVE = TRUE
      AND (
        (START_DATE <= '${endDate}' AND END_DATE >= '${startDate}')
        OR (START_DATE BETWEEN '${startDate}' AND '${endDate}')
        OR (END_DATE BETWEEN '${startDate}' AND '${endDate}')
      )
    `;
    
    const overlapCheck = await executeQuery(checkOverlapQuery);
    if (overlapCheck[0]?.OVERLAP_COUNT > 0) {
      return NextResponse.json(
        { error: 'This user already has an active exclusion that overlaps with the specified date range' },
        { status: 400 }
      );
    }
    
    // All validations passed, proceed with insertion
    const query = `
      INSERT INTO DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_REFEREES_LIST (
        REFEREE_LOGIN,
        EXCLUDED_BY,
        EXCLUSION_REASON,
        START_DATE,
        END_DATE,
        IS_ACTIVE
      ) VALUES (
        '${refereeLogin}',
        '${excludedBy}',
        '${exclusionReason || ""}',
        '${startDate}',
        '${endDate}',
        TRUE
      )
    `;
    
    await executeQuery(query);
    
    // Log this action in the audit table
    const logQuery = `
      INSERT INTO DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_AUDIT_LOG (
        REFEREE_LOGIN,
        ACTION_TYPE,
        ACTION_BY,
        ACTION_DETAILS,
        PREVIOUS_STATE,
        NEW_STATE
      ) VALUES (
        '${refereeLogin}',
        'CREATE',
        '${excludedBy}',
        'Added to exclusion list with reason: ${exclusionReason || "No reason provided"}',
        'Not excluded',
        'Excluded from ${startDate} to ${endDate}'
      )
    `;
    
    await executeQuery(logQuery);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding exclusion:', error);
    return NextResponse.json(
      { error: 'Failed to add exclusion', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 