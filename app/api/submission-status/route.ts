import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'Start date and end date are required' },
      { status: 400 }
    );
  }
  
  try {
    // Check if already submitted
    const submissionQuery = `
      SELECT SUBMISSION_DATE, SUBMITTED_BY
      FROM DEV_ALPHATEL.PRESENTATION.MLM_SUBMISSION_HISTORY
      WHERE DATE(START_DATE) = '${startDate}'
      AND DATE(END_DATE) = '${endDate}'
      ORDER BY SUBMISSION_DATE DESC
      LIMIT 1
    `;
    
    const submissionResult = await executeQuery(submissionQuery);
    const isSubmitted = submissionResult.length > 0;
    const submissionDate = isSubmitted ? submissionResult[0].SUBMISSION_DATE : null;
    const submittedBy = isSubmitted ? submissionResult[0].SUBMITTED_BY : null;
    
    return NextResponse.json({ 
      isSubmitted,
      submissionDate,
      submittedBy
    });
  } catch (error) {
    console.error('Error checking submission status:', error);
    return NextResponse.json(
      { error: 'Failed to check submission status' },
      { status: 500 }
    );
  }
} 