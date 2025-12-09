import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Supabase removed
    return NextResponse.json({ 
    success: false,
    error: 'Database not configured. Supabase has been removed.'
  }, { status: 501 });
}
