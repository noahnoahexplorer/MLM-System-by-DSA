import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

// Update an exclusion for a user (affects both as referrer and referee)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { isActive, exclusionReason, endDate, actionBy } = body;
    
    // Get the current state of the exclusion for audit logging
    const getCurrentStateQuery = `
      SELECT 
        REFEREE_LOGIN,
        IS_ACTIVE,
        EXCLUSION_REASON,
        END_DATE
      FROM DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_REFEREES_LIST
      WHERE ID = ${id}
    `;
    
    const currentState = await executeQuery(getCurrentStateQuery);
    if (!currentState || currentState.length === 0) {
      return NextResponse.json(
        { error: 'Exclusion record not found' },
        { status: 404 }
      );
    }
    
    const current = currentState[0];
    
    let updateFields = [];
    if (isActive !== undefined) updateFields.push(`IS_ACTIVE = ${isActive}`);
    if (exclusionReason !== undefined) updateFields.push(`EXCLUSION_REASON = '${exclusionReason}'`);
    if (endDate) updateFields.push(`END_DATE = '${endDate}'`);
    
    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    const query = `
      UPDATE DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_REFEREES_LIST
      SET ${updateFields.join(', ')}
      WHERE ID = ${id}
    `;
    
    await executeQuery(query);
    
    // Prepare details for audit log
    const changes = [];
    if (isActive !== undefined && isActive !== current.IS_ACTIVE) {
      changes.push(`Status changed from ${current.IS_ACTIVE ? 'active' : 'inactive'} to ${isActive ? 'active' : 'inactive'}`);
    }
    if (exclusionReason !== undefined && exclusionReason !== current.EXCLUSION_REASON) {
      changes.push(`Reason changed from "${current.EXCLUSION_REASON || 'None'}" to "${exclusionReason || 'None'}"`);
    }
    if (endDate && endDate !== current.END_DATE) {
      changes.push(`End date changed from ${current.END_DATE} to ${endDate}`);
    }
    
    // Only log if there were actual changes
    if (changes.length > 0) {
      const actionDetails = changes.join(', ');
      const previousState = `Exclusion was ${current.IS_ACTIVE ? 'active' : 'inactive'} with reason "${current.EXCLUSION_REASON || 'None'}" and end date ${current.END_DATE}`;
      const newState = `Exclusion is ${isActive === undefined ? (current.IS_ACTIVE ? 'active' : 'inactive') : (isActive ? 'active' : 'inactive')} with reason "${exclusionReason === undefined ? (current.EXCLUSION_REASON || 'None') : (exclusionReason || 'None')}" and end date ${endDate || current.END_DATE}`;
      
      const logQuery = `
        INSERT INTO DEV_ALPHATEL.PRESENTATION.MLM_EXCLUSION_AUDIT_LOG (
          REFEREE_LOGIN,
          ACTION_TYPE,
          ACTION_BY,
          ACTION_DETAILS,
          PREVIOUS_STATE,
          NEW_STATE
        ) VALUES (
          '${current.REFEREE_LOGIN}',
          'UPDATE',
          '${actionBy || "System"}',
          '${actionDetails}',
          '${previousState}',
          '${newState}'
        )
      `;
      
      await executeQuery(logQuery);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating exclusion:', error);
    return NextResponse.json(
      { error: 'Failed to update exclusion' },
      { status: 500 }
    );
  }
} 