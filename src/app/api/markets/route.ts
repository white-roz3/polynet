import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Supabase removed - returning empty markets
  return NextResponse.json({
    success: true,
    count: 0,
    markets: [],
    message: 'Database not configured. Supabase has been removed.'
  });
}

