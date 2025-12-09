import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Supabase removed
  return NextResponse.json({
    success: true,
    predictions: []
  });
}
