import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Supabase removed - database not configured
  return NextResponse.json({
    success: true,
    agent: null,
    predictions: [],
    transactions: [],
    parents: [],
    offspring: [],
    performanceData: [],
    categoryBreakdown: {}
  });
}
