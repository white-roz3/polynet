import { NextResponse } from 'next/server';

/**
 * Unified Markets API
 * Fetches markets from both Kalshi and Polymarket and combines them
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '30');
  const status = searchParams.get('status') || 'open';

  try {
    // Fetch from both APIs in parallel
    // Request significantly more from each source to account for filtering
    // We'll filter out extreme odds, so we need to fetch 10-15x more to get enough balanced markets
    const fetchLimit = Math.max(limit * 10, 1000); // Fetch at least 10x the requested limit, minimum 1000
    const [kalshiResponse, polymarketResponse] = await Promise.allSettled([
      fetch(`${new URL(request.url).origin}/api/kalshi/markets?limit=${fetchLimit}&status=${status}`),
      fetch(`${new URL(request.url).origin}/api/polymarket/markets?limit=${fetchLimit}&offset=0`),
    ]);

    const allMarkets: any[] = [];

    // Process Kalshi markets
    if (kalshiResponse.status === 'fulfilled' && kalshiResponse.value.ok) {
      try {
        const kalshiData = await kalshiResponse.value.json();
        if (kalshiData.success && kalshiData.markets?.length > 0) {
          allMarkets.push(...kalshiData.markets);
        }
      } catch (e) {
        console.error('Error parsing Kalshi response:', e);
      }
    } else {
      console.warn('Kalshi API request failed:', kalshiResponse.status === 'rejected' ? kalshiResponse.reason : 'Request not OK');
    }

    // Process Polymarket markets
    if (polymarketResponse.status === 'fulfilled' && polymarketResponse.value.ok) {
      try {
        const polymarketData = await polymarketResponse.value.json();
        if (polymarketData.success && polymarketData.markets?.length > 0) {
          // Transform Polymarket format to match our unified format
          const transformedMarkets = polymarketData.markets.map((m: any) => ({
            id: m.id,
            ticker: m.marketSlug || m.id,
            question: m.question,
            description: m.description || '',
            yes_price: m.outcomePrices?.[0] || 0.5,
            no_price: m.outcomePrices?.[1] || 0.5,
            volume: parseFloat(m.volume) || 0,
            volume_24h: parseFloat(m.volume_24h) || 0,
            liquidity: parseFloat(m.liquidity) || 0,
            end_date: m.endDate || m.end_date,
            category: m.category || 'Trending',
            image_url: m.icon || m.image_url,
            outcomePrices: m.outcomePrices || [m.yes_price || 0.5, m.no_price || 0.5],
            marketSlug: m.marketSlug || m.slug,
            source: 'polymarket',
          }));
          allMarkets.push(...transformedMarkets);
        }
      } catch (e) {
        console.error('Error parsing Polymarket response:', e);
      }
    } else {
      console.warn('Polymarket API request failed:', polymarketResponse.status === 'rejected' ? polymarketResponse.reason : 'Request not OK');
    }

    // Remove duplicates (by ID) and sort by volume
    const uniqueMarkets = Array.from(
      new Map(allMarkets.map(m => [m.id, m])).values()
    )
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: uniqueMarkets.length,
      markets: uniqueMarkets,
      sources: {
        kalshi: kalshiResponse.status === 'fulfilled' && kalshiResponse.value.ok,
        polymarket: polymarketResponse.status === 'fulfilled' && polymarketResponse.value.ok,
      },
    });

  } catch (error: any) {
    console.error('Unified Markets API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch unified markets',
        message: error.message,
        markets: [],
      },
      { status: 500 }
    );
  }
}

