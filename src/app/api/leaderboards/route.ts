import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric') || 'accuracy';
  
  // Supabase removed - returning empty leaderboard
  return NextResponse.json({
    success: true,
    metric,
    leaderboard: [],
    message: 'Database not configured. Supabase has been removed.'
  });
}
