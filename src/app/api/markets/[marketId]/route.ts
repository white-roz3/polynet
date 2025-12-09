import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { marketId: string } }
) {
  // Supabase removed
  return NextResponse.json(
    { success: false, error: 'Market not found. Database not configured.' },
    { status: 404 }
  );
}

