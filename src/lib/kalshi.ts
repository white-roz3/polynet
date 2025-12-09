/**
 * Kalshi API Client
 * Documentation: https://docs.kalshi.com
 */

import crypto from 'crypto';

const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
const KALSHI_DEMO_API_BASE = 'https://demo-api.kalshi.co/trade-api/v2';

interface KalshiConfig {
  apiKeyId?: string;
  privateKey?: string;
  useDemoApi?: boolean;
}

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle?: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  status: string;
  result?: string;
  expiration_time: string;
  close_time: string;
  category?: string;
  rules_primary?: string;
  settlement_timer_seconds?: number;
}

export interface KalshiEvent {
  event_ticker: string;
  series_ticker: string;
  title: string;
  category: string;
  mutually_exclusive: boolean;
  markets: KalshiMarket[];
  strike_date?: string;
}

class KalshiClient {
  private apiKeyId: string | null;
  private privateKey: string | null;
  private baseUrl: string;

  constructor(config: KalshiConfig = {}) {
    this.apiKeyId = config.apiKeyId || process.env.KALSHI_API_KEY_ID || null;
    this.privateKey = config.privateKey || process.env.KALSHI_PRIVATE_KEY || null;
    this.baseUrl = config.useDemoApi ? KALSHI_DEMO_API_BASE : KALSHI_API_BASE;
  }

  private generateSignature(timestamp: string, method: string, path: string): string {
    if (!this.privateKey) {
      throw new Error('Private key required for authenticated requests');
    }

    const message = `${timestamp}${method}${path}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    sign.end();
    
    return sign.sign(this.privateKey, 'base64');
  }

  private getHeaders(method: string, path: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.apiKeyId && this.privateKey) {
      const timestamp = Date.now().toString();
      headers['KALSHI-ACCESS-KEY'] = this.apiKeyId;
      headers['KALSHI-ACCESS-TIMESTAMP'] = timestamp;
      headers['KALSHI-ACCESS-SIGNATURE'] = this.generateSignature(timestamp, method, path);
    }

    return headers;
  }

  async request<T>(method: string, path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders(method, path);

    const options: RequestInit = {
      method,
      headers,
      next: { revalidate: 60 }, // Cache for 1 minute
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kalshi API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get all events with their markets
   */
  async getEvents(params?: {
    limit?: number;
    cursor?: string;
    status?: 'open' | 'closed' | 'settled';
    series_ticker?: string;
    with_nested_markets?: boolean;
  }): Promise<{ events: KalshiEvent[]; cursor?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.series_ticker) searchParams.set('series_ticker', params.series_ticker);
    if (params?.with_nested_markets) searchParams.set('with_nested_markets', 'true');

    const path = `/events${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return this.request<{ events: KalshiEvent[]; cursor?: string }>('GET', path);
  }

  /**
   * Get a specific event by ticker
   */
  async getEvent(eventTicker: string, withNestedMarkets = true): Promise<KalshiEvent> {
    const path = `/events/${eventTicker}${withNestedMarkets ? '?with_nested_markets=true' : ''}`;
    const response = await this.request<{ event: KalshiEvent }>('GET', path);
    return response.event;
  }

  /**
   * Get all markets
   */
  async getMarkets(params?: {
    limit?: number;
    cursor?: string;
    event_ticker?: string;
    series_ticker?: string;
    status?: 'open' | 'closed' | 'settled';
    tickers?: string;
  }): Promise<{ markets: KalshiMarket[]; cursor?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.event_ticker) searchParams.set('event_ticker', params.event_ticker);
    if (params?.series_ticker) searchParams.set('series_ticker', params.series_ticker);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.tickers) searchParams.set('tickers', params.tickers);

    const path = `/markets${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return this.request<{ markets: KalshiMarket[]; cursor?: string }>('GET', path);
  }

  /**
   * Get a specific market by ticker
   */
  async getMarket(ticker: string): Promise<KalshiMarket> {
    const path = `/markets/${ticker}`;
    const response = await this.request<{ market: KalshiMarket }>('GET', path);
    return response.market;
  }

  /**
   * Get market orderbook
   */
  async getOrderbook(ticker: string, depth?: number): Promise<{
    ticker: string;
    yes: { price: number; quantity: number }[];
    no: { price: number; quantity: number }[];
  }> {
    const path = `/markets/${ticker}/orderbook${depth ? `?depth=${depth}` : ''}`;
    return this.request('GET', path);
  }

  /**
   * Get market trades/history
   */
  async getTrades(ticker: string, params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ trades: any[]; cursor?: string }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.cursor) searchParams.set('cursor', params.cursor);

    const path = `/markets/${ticker}/trades${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return this.request('GET', path);
  }
}

// Export singleton instance
export const kalshiClient = new KalshiClient();

// Export class for custom configurations
export { KalshiClient };


