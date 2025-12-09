import { NextResponse } from 'next/server';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  conditionId: string;
  clobTokenIds: string[];
  outcomePrices: number[];
  outcomes: string[];
  volume: string;
  liquidity: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  marketSlug: string;
  icon?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  try {
    // Fetch markets from multiple pages to get enough after filtering
    // Polymarket API typically limits per request, so we'll make multiple requests
    const perPageLimit = 100; // Max per request
    const pagesNeeded = Math.ceil(Math.max(limit * 5, 500) / perPageLimit); // Fetch 5x to account for filtering
    const allRawMarkets: any[] = [];
    
    // Fetch from multiple pages in parallel
    const fetchPromises = [];
    for (let i = 0; i < pagesNeeded; i++) {
      const pageOffset = offset + (i * perPageLimit);
      const url = `${GAMMA_API_BASE}/markets?active=true&closed=false&archived=false&limit=${perPageLimit}&offset=${pageOffset}`;
      fetchPromises.push(
        fetch(url, { cache: 'no-store' })
          .then(res => res.ok ? res.json() : [])
          .then(data => Array.isArray(data) ? data : [])
          .catch(() => [])
      );
    }
    
    const results = await Promise.all(fetchPromises);
    const rawMarkets = results.flat();
    
    // Parse stringified JSON fields and transform data
    const markets = rawMarkets
      .map((market: any) => {
        let clobTokenIds: string[] = [];
        let outcomePrices: number[] = [];
        
        // Parse stringified JSON arrays
        try {
          clobTokenIds = JSON.parse(market.clobTokenIds || '[]');
        } catch (e) {
          console.warn('Failed to parse clobTokenIds:', e);
        }
        
        try {
          outcomePrices = JSON.parse(market.outcomePrices || '[]').map(Number);
        } catch (e) {
          console.warn('Failed to parse outcomePrices:', e);
        }
        
        const yesPrice = outcomePrices[0] || 0.5;
        const noPrice = outcomePrices[1] || (1 - yesPrice);
        const volume = parseFloat(market.volume) || 0;
        
        return {
          id: market.id,
          question: market.question,
          description: market.description || '',
          conditionId: market.conditionId,
          clobTokenIds,
          outcomePrices,
          outcomes: market.outcomes || ['Yes', 'No'],
          volume: volume,
          liquidity: parseFloat(market.liquidity) || 0,
          endDate: market.endDate,
          active: market.active,
          closed: market.closed,
          marketSlug: market.marketSlug,
          icon: market.icon,
          yes_price: yesPrice,
          no_price: noPrice,
        };
      })
      // Filter out markets with very low activity (lower threshold for more markets)
      .filter((m: any) => (m.volume || 0) > 100)
      // Keep balanced/competitive markets, exclude extreme odds
      .filter((m: any) => {
        const yesPrice = m.yes_price || m.outcomePrices?.[0] || 0.5;
        const yesPercent = yesPrice * 100;
        
        // EXCLUDE extreme/pointless odds (1-3% and 97-99%)
        // These are too lopsided to be interesting
        const isExtreme = yesPercent <= 3 || yesPercent >= 97;
        if (isExtreme) return false;
        
        // KEEP balanced markets: 10-90% range for good variety (relaxed to get more markets)
        // This includes competitive markets while filtering out the most extreme ones
        const isBalanced = yesPercent >= 10 && yesPercent <= 90;
        
        return isBalanced;
      })
      // Sort by volume (most active first) and recency
      .sort((a: any, b: any) => {
        // Prioritize higher volume
        const volumeDiff = (b.volume || 0) - (a.volume || 0);
        if (Math.abs(volumeDiff) > 10000) return volumeDiff;
        
        // For similar volumes, prioritize more recent markets
        const aDate = a.endDate ? new Date(a.endDate).getTime() : 0;
        const bDate = b.endDate ? new Date(b.endDate).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, limit);
    
    return NextResponse.json({
      success: true,
      count: markets.length,
      markets
    });
    
  } catch (error: any) {
    console.error('Polymarket API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch markets from Polymarket',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// Optional: Endpoint to get a specific market by ID
export async function POST(request: Request) {
  try {
    const { marketId } = await request.json();
    
    if (!marketId) {
      return NextResponse.json(
        { success: false, error: 'marketId required' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${GAMMA_API_BASE}/markets/${marketId}`);
    
    if (!response.ok) {
      throw new Error('Market not found');
    }
    
    const market = await response.json();
    
    // Parse stringified fields
    const parsedMarket = {
      ...market,
      clobTokenIds: JSON.parse(market.clobTokenIds || '[]'),
      outcomePrices: JSON.parse(market.outcomePrices || '[]').map(Number)
    };
    
    return NextResponse.json({
      success: true,
      market: parsedMarket
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

