import { NextResponse } from 'next/server';

const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const cursor = searchParams.get('cursor') || '';
  const status = searchParams.get('status') || 'open';
  const withMarkets = searchParams.get('with_nested_markets') !== 'false';

  try {
    // Build query params
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (cursor) params.set('cursor', cursor);
    if (status) params.set('status', status);
    if (withMarkets) params.set('with_nested_markets', 'true');

    const url = `${KALSHI_API_BASE}/events?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`Kalshi API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Transform events
    const events = (data.events || []).map((event: any) => ({
      id: event.event_ticker,
      event_ticker: event.event_ticker,
      series_ticker: event.series_ticker,
      title: event.title,
      category: event.category || 'General',
      mutually_exclusive: event.mutually_exclusive,
      strike_date: event.strike_date,
      markets: (event.markets || []).map((market: any) => ({
        id: market.ticker,
        ticker: market.ticker,
        question: market.title,
        subtitle: market.subtitle,
        yes_price: market.yes_bid ? market.yes_bid / 100 : 0.5,
        no_price: market.no_bid ? market.no_bid / 100 : 0.5,
        last_price: market.last_price ? market.last_price / 100 : 0.5,
        volume: market.volume || 0,
        volume_24h: market.volume_24h || 0,
        status: market.status,
        end_date: market.expiration_time || market.close_time,
        outcomePrices: [
          market.yes_bid ? market.yes_bid / 100 : 0.5,
          market.no_bid ? market.no_bid / 100 : 0.5
        ],
      })),
    }));

    return NextResponse.json({
      success: true,
      count: events.length,
      cursor: data.cursor,
      events,
    });

  } catch (error: any) {
    console.error('Kalshi API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch events from Kalshi',
        message: error.message,
      },
      { status: 500 }
    );
  }
}


