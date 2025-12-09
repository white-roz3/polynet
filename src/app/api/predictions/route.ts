import { NextResponse } from 'next/server';

// GET - Fetch predictions for an agent
export async function GET(request: Request) {
  // Supabase removed
  return NextResponse.json({
    success: true,
    predictions: []
  });
}

// POST - Save a new prediction
export async function POST(request: Request) {
  // Supabase removed
  return NextResponse.json({
    success: false,
    error: 'Database not configured. Supabase has been removed.'
  }, { status: 501 });
}
