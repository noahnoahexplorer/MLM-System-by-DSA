import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/snowflake';

export async function GET() {
  try {
    // Fetch commission data
    const commissionQuery = `
      SELECT * FROM DEV_DSA.PRESENTATION.DAILY_COMMISSION
      ORDER BY SUMMARY_MONTH DESC
    `;
    
    // Fetch network data
    const networkQuery = `
      SELECT * FROM DEV_DSA.PRESENTATION.REFERRAL_NETWORK
    `;
    
    const [commissionData, networkData] = await Promise.all([
      executeQuery(commissionQuery),
      executeQuery(networkQuery)
    ]);
    
    return NextResponse.json({ 
      commission: commissionData,
      network: networkData 
    });
  } catch (error) {
    console.error('Error fetching MLM data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MLM data' },
      { status: 500 }
    );
  }
} 