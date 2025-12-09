import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Supabase removed
  return NextResponse.json({
    success: false,
    error: 'Database not configured. Supabase has been removed.'
  }, { status: 501 });
}
