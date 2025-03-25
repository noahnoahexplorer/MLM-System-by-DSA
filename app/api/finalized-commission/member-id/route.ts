import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(request: Request) {
  try {
    // Get start and end dates from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Fetch member data with MEMBER_ID from DSA view
    const memberQuery = `
      SELECT 
        MEMBER_LOGIN,
        MEMBER_ID,
        MEMBER_GROUP
      FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
      WHERE DATE(START_DATE) = '${startDate}'
      AND DATE(END_DATE) = '${endDate}'
      GROUP BY MEMBER_LOGIN, MEMBER_ID, MEMBER_GROUP
    `;
    
    const memberData = await executeQuery(memberQuery);
    
    return NextResponse.json({ 
      members: memberData
    });
  } catch (error) {
    console.error('Error fetching member ID data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member ID data' },
      { status: 500 }
    );
  }
} 