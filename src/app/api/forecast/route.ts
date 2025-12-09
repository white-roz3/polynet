import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 800;

export async function POST(req: NextRequest) {
  // Supabase removed - forecast functionality disabled
    return NextResponse.json(
      { 
        success: false, 
      error: 'Database not configured. Supabase has been removed.'
      },
    { status: 501 }
    );
}

export async function GET() {
  return NextResponse.json({
    message: 'Forecast API - Database not configured',
    error: 'Supabase has been removed'
  });
}
