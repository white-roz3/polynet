import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Supabase removed
  return NextResponse.json({
    success: true,
    stats: {
      total: 0,
      resolved: 0,
      unresolved: 0,
      correct: 0,
      incorrect: 0,
      accuracy: '0.00',
      yesPredictions: 0,
      noPredictions: 0,
      totalResearchCost: '0.00',
      totalProfitLoss: '0.00',
      avgConfidence: '0.0',
      currentStreak: 0,
      longestStreak: 0
    }
  });
}
