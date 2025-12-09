import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Supabase removed
  return NextResponse.json({
    success: true,
    stats: {
      accuracy: '0.00',
      roi: '0.00',
      total_profit_loss: 0,
      resolved_predictions: 0,
      correct_predictions: 0
    }
  });
}
