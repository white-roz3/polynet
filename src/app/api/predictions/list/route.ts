import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Supabase removed
  return NextResponse.json({
    success: true,
    predictions: [],
    total: 0,
    message: 'Database not configured. Supabase has been removed.'
  });
}

