import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { marketId: string } }
) {
  // Supabase removed
  return NextResponse.json({
    success: true,
    predictions: []
  });
}

