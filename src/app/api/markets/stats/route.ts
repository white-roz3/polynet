import { NextResponse } from 'next/server';

export async function GET() {
  // Supabase removed
  return NextResponse.json({
    success: true,
    stats: {
      total: 0,
      active: 0,
      resolved: 0,
      avgVolume: 0
    }
  });
}

