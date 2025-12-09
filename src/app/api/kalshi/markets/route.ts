import { NextResponse } from 'next/server';

// Kalshi API endpoints
const KALSHI_API_BASE = 'https://trading-api.kalshi.com/trade-api/v2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '24');
  const status = searchParams.get('status') || 'open';

  try {
    // Kalshi API requires authentication, but we can use their public endpoints
    // For now, we'll use a simplified approach - Kalshi's public API may require API keys
    // This is a placeholder that will need Kalshi API credentials
    
    // Note: Kalshi API typically requires authentication
    // You'll need to set KALSHI_API_KEY and KALSHI_KEY_ID in environment variables
    const apiKey = process.env.KALSHI_API_KEY;
    const keyId = process.env.KALSHI_KEY_ID;
    
    // For public access, try their exchange API endpoint
    // Kalshi uses a different structure - markets are called "events"
    // Fetch significantly more markets to account for filtering (we'll filter out extreme odds)
    // Need to fetch 15-20x more to ensure we get enough balanced markets after filtering
    const fetchLimit = Math.max(limit * 15, 1000);
    const url = `${KALSHI_API_BASE}/exchange/events?limit=${fetchLimit}&status=${status}`;
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    // Add authentication if available
    if (apiKey && keyId) {
      headers['Authorization'] = `Basic ${Buffer.from(`${keyId}:${apiKey}`).toString('base64')}`;
    }
    
    const response = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      // If Kalshi API fails, fall back to a mock response or return empty
      console.warn(`Kalshi API returned ${response.status}, falling back to empty markets`);
      return NextResponse.json({
        success: true,
        count: 0,
        markets: [],
        message: 'Kalshi API requires authentication. Set KALSHI_API_KEY and KALSHI_KEY_ID environment variables.',
      });
    }

    const data = await response.json();
    
    // Transform Kalshi events to our market format
    // Kalshi API structure: events array with event_ticker, title, etc.
    const events = data.events || data || [];
    
    const markets = events
      .map((event: any) => {
        // Kalshi uses different field names
        const eventTicker = event.event_ticker || event.ticker || event.id;
        const title = event.title || event.question || '';
        const yesPrice = parseFloat(event.yes_bid) || parseFloat(event.yes_price) || 0.5;
        const noPrice = parseFloat(event.no_bid) || parseFloat(event.no_price) || (1 - yesPrice);
        const volume = parseFloat(event.volume) || parseFloat(event.total_volume) || 0;
        
        return {
          id: eventTicker,
          ticker: eventTicker,
          question: title,
          description: event.description || event.subtitle || '',
          yes_price: yesPrice,
          no_price: noPrice,
          volume: volume,
          volume_24h: parseFloat(event.volume_24h) || 0,
          liquidity: parseFloat(event.liquidity) || 0,
          end_date: event.expiration_time || event.end_time || event.close_time,
          category: extractCategory(title, event.category),
          image_url: event.image || event.icon,
          outcomePrices: [yesPrice, noPrice],
          marketSlug: eventTicker,
          source: 'kalshi',
        };
      })
      // Filter out markets with very low activity (lower threshold for more markets)
      .filter((m: any) => m.volume > 100)
      // Keep balanced/competitive markets, exclude extreme odds
      .filter((m: any) => {
        const yesPrice = m.yes_price || 0.5;
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
        const aDate = a.end_date ? new Date(a.end_date).getTime() : 0;
        const bDate = b.end_date ? new Date(b.end_date).getTime() : 0;
        return bDate - aDate;
      })
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
