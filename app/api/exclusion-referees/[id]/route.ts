import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

// Update an exclusion
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { isActive, exclusionReason, endDate } = body;
    
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
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating exclusion:', error);
    return NextResponse.json(
      { error: 'Failed to update exclusion' },
      { status: 500 }
    );
  }
} 