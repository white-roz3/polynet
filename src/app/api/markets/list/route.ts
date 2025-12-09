import { NextResponse } from 'next/server';
import { getAllMarkets } from '@/lib/db/markets';

export async function GET() {
  try {
    let markets: any[] = [];
    try {
      markets = getAllMarkets();
    } catch (dbError: any) {
      console.error('Database error fetching markets:', dbError);
      // Return empty array if database fails
      return NextResponse.json({
        success: true,
        count: 0,
        markets: []
      });
    }
    
    return NextResponse.json({
      success: true,
      count: markets.length,
      markets
    });
  } catch (error: any) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { success: true, count: 0, markets: [], error: error.message },
      { status: 200 }
    );
  }
}
