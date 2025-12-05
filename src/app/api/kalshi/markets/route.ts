import { NextResponse } from 'next/server';

// Use Polymarket for fresh, active markets
const POLYMARKET_API = 'https://gamma-api.polymarket.com';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '24');

  try {
    // Fetch active markets from Polymarket
    const response = await fetch(
      `${POLYMARKET_API}/markets?limit=${limit * 2}&active=true&closed=false`,
      {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store', // Disable caching for fresh data
      }
    );

    if (!response.ok) {
      throw new Error(`Polymarket API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Transform and sort by volume (most active first)
    const markets = data
      .map((market: any) => {
        const volume = parseFloat(market.volume) || 0;
        const outcomePrices = market.outcomePrices ? 
          (typeof market.outcomePrices === 'string' ? JSON.parse(market.outcomePrices) : market.outcomePrices) 
          : [0.5, 0.5];
        
        const yesPrice = parseFloat(outcomePrices[0]) || 0.5;
        const noPrice = parseFloat(outcomePrices[1]) || (1 - yesPrice);

        // Generate a readable ticker from question
        const shortTicker = generateTicker(market.question);
        
        return {
          id: market.id,
          ticker: shortTicker,
          question: market.question,
          description: market.description || '',
          yes_price: yesPrice,
          no_price: noPrice,
          volume: volume,
          volume_24h: parseFloat(market.volume24hr) || 0,
          liquidity: parseFloat(market.liquidity) || 0,
          end_date: market.endDate,
          category: extractCategory(market.question, market.groupItemTitle),
          image_url: market.image,
          outcomePrices: [yesPrice, noPrice],
          marketSlug: market.slug,
          source: 'polymarket',
        };
      })
      // Filter out markets with very low activity
      .filter((m: any) => m.volume > 1000)
      // Sort by volume descending
      .sort((a: any, b: any) => b.volume - a.volume)
      // Take the requested limit
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: markets.length,
      markets,
    });

  } catch (error: any) {
    console.error('Market API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch markets',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Generate a readable ticker from question
function generateTicker(question: string): string {
  const q = question?.toLowerCase() || '';
  
  // Extract key terms and create a ticker
  const keywords = q
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(w => w.length > 2 && !['the', 'will', 'are', 'and', 'for', 'that', 'this', 'with', 'before', 'after', 'into'].includes(w))
    .slice(0, 3)
    .map(w => w.toUpperCase().slice(0, 4))
    .join('-');
  
  return keywords || 'MRKT';
}

// Extract category from question
function extractCategory(question: string, groupTitle?: string): string {
  const q = question?.toLowerCase() || '';
  const g = groupTitle?.toLowerCase() || '';
  
  if (q.includes('trump') || q.includes('biden') || q.includes('election') || q.includes('president') || q.includes('congress') || q.includes('senate')) {
    return 'Politics';
  }
  if (q.includes('fed') || q.includes('rate cut') || q.includes('recession') || q.includes('inflation') || q.includes('gdp') || q.includes('jobs')) {
    return 'Economics';
  }
  if (q.includes('bitcoin') || q.includes('eth') || q.includes('crypto') || q.includes('btc')) {
    return 'Crypto';
  }
  if (q.includes('ukraine') || q.includes('russia') || q.includes('war') || q.includes('iran') || q.includes('israel') || q.includes('china')) {
    return 'Geopolitics';
  }
  if (q.includes('nfl') || q.includes('nba') || q.includes('super bowl') || q.includes('championship') || g.includes('sport')) {
    return 'Sports';
  }
  if (q.includes('ai') || q.includes('openai') || q.includes('chatgpt') || q.includes('tech')) {
    return 'Tech';
  }
  if (q.includes('nuclear') || q.includes('climate') || q.includes('weather')) {
    return 'World';
  }
  
  return 'Trending';
}
