'use client';

import { useState, useEffect } from 'react';

interface Market {
  id: string;
  question: string;
  description: string;
  outcomePrices: number[];
  outcomes: string[];
  volume: string;
  liquidity: string;
  endDate: string;
  marketSlug: string;
}

export default function PolymarketMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/polymarket/markets?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setMarkets(data.markets);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch markets');
      }
    } catch (err) {
      setError('Failed to connect to Polymarket API');
      console.error('Error fetching markets:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading && markets.length === 0) {
    return (
      <div className="kalshinet-card p-4">
        <div className="text-white font-semibold mb-4 flex items-center gap-2 text-base">
          ◎ POLYMARKET FEED
        </div>
        <div className="text-center text-gray-500 py-8 text-xs">
          Loading markets<span className="animate-pulse">...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="kalshinet-card p-4">
        <div className="text-white font-semibold mb-4 flex items-center gap-2 text-base">
          ◎ POLYMARKET FEED
        </div>
        <div className="text-center py-8">
          <div className="text-xs text-gray-400 mb-4">{error}</div>
          <button 
            onClick={fetchMarkets}
            className="kalshinet-card px-4 py-2 font-semibold text-white hover:bg-[#1e2235] text-xs transition-colors"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="kalshinet-card p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-white font-semibold flex items-center gap-2 text-base">
          ◎ POLYMARKET FEED
        </div>
        <div className="text-xs text-gray-500">
          {lastUpdate && `${lastUpdate.toLocaleTimeString()}`}
        </div>
      </div>
      
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {markets.map(market => {
          const yesPrice = market.outcomePrices[0] || 0;
          const noPrice = market.outcomePrices[1] || (1 - yesPrice);
          const yesPct = (yesPrice * 100).toFixed(1);
          const noPct = (noPrice * 100).toFixed(1);
          const volumeFormatted = parseFloat(market.volume).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
          const endDate = new Date(market.endDate).toLocaleDateString();
          
          return (
            <div key={market.id} className="kalshinet-card p-3 hover:bg-[#1e2235] transition-colors">
              <div className="text-white text-sm mb-3 font-semibold leading-tight">
                {market.question}
              </div>
              
              <div className="flex justify-between items-center text-xs mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-[#00C853] font-bold">
                    YES {yesPct}%
                  </span>
                  <span className="text-gray-600">|</span>
                  <span className="text-[#E91E8C] font-bold">
                    NO {noPct}%
                  </span>
                </div>
                <div className="text-[#00C853] font-bold">
                  ${volumeFormatted}
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <div className="text-gray-500">
                  Ends: {endDate}
                </div>
                <a 
                  href={`https://polymarket.com/event/${market.marketSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00C853] hover:text-[#00E676] font-semibold transition-colors"
                >
                  VIEW ▶
                </a>
              </div>
            </div>
          );
        })}
      </div>
      
      <button
        onClick={fetchMarkets}
        disabled={loading}
        className="mt-4 w-full kalshinet-card px-4 py-2 font-semibold text-white hover:bg-[#1e2235] disabled:opacity-50 text-xs transition-colors"
      >
        {loading ? 'Refreshing...' : '↻ REFRESH MARKETS'}
      </button>
    </div>
  );
}
