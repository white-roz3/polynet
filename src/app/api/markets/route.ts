import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const active = searchParams.get('active') !== 'false';

  try {
    let query = supabase
      .from('polymarket_markets')
      .select('*')
      .order('volume', { ascending: false })
      .range(offset, offset + limit - 1);

    if (active) {
      query = query.eq('is_active', true);
    }

    const { data: markets, error } = await query;

    if (error) throw error;

    // Transform to match expected format
    const formattedMarkets = (markets || []).map((market: any) => ({
      id: market.polymarket_id || market.id,
      question: market.question,
      description: market.description || '',
      outcomePrices: [market.yes_price || 0.5, market.no_price || 0.5],
      outcomes: ['Yes', 'No'],
      volume: (market.volume || 0).toString(),
      liquidity: (market.liquidity || 0).toString(),
      endDate: market.end_date || market.resolution_date,
      marketSlug: market.market_slug || market.polymarket_id,
      yes_price: market.yes_price,
      no_price: market.no_price,
      total_volume: market.volume,
      category: market.category || 'General'
    }));

    return NextResponse.json({
      success: true,
      count: formattedMarkets.length,
      markets: formattedMarkets
    });

  } catch (error: any) {
    console.error('Markets API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch markets',
        message: error.message
      },
      { status: 500 }
    );
  }
}

