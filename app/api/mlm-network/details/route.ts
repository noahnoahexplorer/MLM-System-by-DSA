import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET(
  request: Request,
  { params }: { params: Record<string, string> }
) {
  try {
    // Get query parameters using URLSearchParams
    const searchParams = new URLSearchParams(request.url.split('?')[1]);
    const memberLogin = searchParams.get('memberLogin');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('API received params:', { memberLogin, startDate, endDate }); // Debug log

    if (!memberLogin || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const detailsQuery = `
      SELECT 
        RELATIVE_LEVEL,
        RELATIVE_LEVEL_REFEREE_LOGIN,
        SUM(LOCAL_COMMISSION_AMOUNT) as TOTAL_COMMISSION,
        SUM(TOTAL_DEPOSIT_AMOUNT) as TOTAL_DEPOSIT_AMOUNT,
        SUM(TOTAL_VALID_TURNOVER) as TOTAL_VALID_TURNOVER,
        SUM(TOTAL_WIN_LOSS) as TOTAL_WIN_LOSS
      FROM PROD_ALPHATEL.PRESENTATION.VIEW_MLM_DAILY_COMMISSION
      WHERE 
        MEMBER_LOGIN = '${memberLogin}'
        AND START_DATE >= DATE('${startDate}')
        AND END_DATE <= DATE('${endDate}')
        AND RELATIVE_LEVEL IS NOT NULL
      GROUP BY 
        MEMBER_LOGIN,
        RELATIVE_LEVEL,
        RELATIVE_LEVEL_REFEREE_LOGIN
      ORDER BY 
        MEMBER_LOGIN,
        RELATIVE_LEVEL
    `;

    console.log('Executing query:', detailsQuery); // Debug log
    
    const details = await executeQuery(detailsQuery);
    
    console.log('Query results:', details); // Debug log

    return NextResponse.json({ details });
  } catch (error) {
    console.error('Error fetching commission details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commission details' },
      { status: 500 }
    );
  }
} 