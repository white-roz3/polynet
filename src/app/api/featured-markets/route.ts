import { NextResponse } from 'next/server';

export interface FeaturedMarket {
  id: number;
  slug: string;
  question: string;
  category: string | null;
  polymarket_url: string;
  volume: number;
  end_date: string;
  current_odds: any;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface FeaturedMarketsResponse {
  success: boolean;
  markets: FeaturedMarket[];
  count: number;
  last_updated?: string;
}

export async function GET() {
  // Supabase removed
  return NextResponse.json({
    success: true,
    markets: [],
    count: 0,
    message: 'Database not configured. Supabase has been removed.'
  });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
