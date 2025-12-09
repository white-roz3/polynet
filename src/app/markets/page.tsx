'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '@/styles/polynet.css';
import { MainNav } from '@/components/navigation/MainNav';

interface Market {
  id: string;
  polymarket_id: string;
  question: string;
  description: string;
  market_slug: string;
  yes_price: number;
  no_price: number;
  volume: number;
  volume_24hr: number;
  category: string;
  end_date: string;
  image_url: string;
  prediction_count?: number;
}

type ViewMode = 'live' | 'top';
type SortBy = 'volume' | 'predictions' | 'ending_soon' | 'newest';

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('volume');
  
  useEffect(() => {
    fetchMarkets();
    
    if (viewMode === 'live') {
      const interval = setInterval(fetchMarkets, 60000);
      return () => clearInterval(interval);
    }
  }, [viewMode]);
  
  const fetchMarkets = async () => {
    try {
      const response = await fetch('/api/markets/list');
      const data = await response.json();
      
      if (data.success) {
        const mappedMarkets = data.markets.map((m: any) => ({
          ...m,
          polymarket_id: m.id,
          market_slug: m.slug,
          prediction_count: 0
        }));
        setMarkets(mappedMarkets);
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const categories = ['all', ...new Set(markets.map(m => m.category).filter(Boolean))];
  
  const filteredMarkets = markets.filter(market => {
    const matchesSearch = searchQuery === '' || 
      market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || market.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return (b.volume || 0) - (a.volume || 0);
      case 'predictions':
        return (b.prediction_count || 0) - (a.prediction_count || 0);
      case 'ending_soon':
        return new Date(a.end_date || '').getTime() - new Date(b.end_date || '').getTime();
      case 'newest':
        return new Date(b.end_date || '').getTime() - new Date(a.end_date || '').getTime();
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="polynet-container min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading markets...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="polynet-container min-h-screen">
      <MainNav />
      
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Markets</h1>
            <p className="text-gray-500">Browse {markets.length} live prediction markets</p>
          </div>
          
          {viewMode === 'live' && (
            <div className="polynet-live-badge">
              Auto-refresh: 60s
            </div>
          )}
        </div>
        
        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('live')}
            className={`polynet-pill ${viewMode === 'live' ? 'polynet-pill-active' : ''}`}
          >
            Live Markets
          </button>
          <button
            onClick={() => setViewMode('top')}
            className={`polynet-pill ${viewMode === 'top' ? 'polynet-pill-active' : ''}`}
          >
            Top Markets
          </button>
        </div>
        
        {/* Filters */}
        <div className="polynet-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bitcoin, Trump, AI..."
                className="polynet-input"
              />
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="polynet-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="polynet-select"
              >
                <option value="volume">Volume</option>
                <option value="predictions">AI Predictions</option>
                <option value="ending_soon">Ending Soon</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
          
          {/* Active filters */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchQuery && (
                <span className="polynet-pill text-xs">"{searchQuery}"</span>
              )}
              {selectedCategory !== 'all' && (
                <span className="polynet-pill text-xs">{selectedCategory}</span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        
        {/* Results count */}
        <div className="text-sm text-gray-500 mb-4">
          Showing {sortedMarkets.length} markets
        </div>
        
        {/* Empty state */}
        {sortedMarkets.length === 0 && (
          <div className="polynet-card p-12 text-center">
            <div className="polynet-empty-icon">🔍</div>
            <h2 className="polynet-empty-title">No markets found</h2>
            <p className="polynet-empty-description mb-6">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                fetchMarkets();
              }}
              className="polynet-btn polynet-btn-secondary"
            >
              Reset Filters
            </button>
          </div>
        )}
        
        {/* Markets Grid */}
        {sortedMarkets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMarkets.map(market => (
              <div key={market.id} className="polynet-market-card">
                {/* Image */}
                {market.image_url && (
                  <div className="h-40 overflow-hidden rounded-lg mb-4 bg-gray-100">
                    <img
                      src={market.image_url}
                      alt={market.question}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Category */}
                {market.category && (
                  <span className="polynet-badge polynet-badge-neutral text-xs mb-3">
                    {market.category}
                  </span>
                )}
                
                {/* Question */}
                <h3 className="polynet-market-title">
                  {market.question}
                </h3>
                
                {/* Prices */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Yes</div>
                    <div className="text-2xl font-bold text-[#00C853]">
                      {Math.round(market.yes_price * 100)}¢
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">No</div>
                    <div className="text-2xl font-bold text-[#E91E8C]">
                      {Math.round(market.no_price * 100)}¢
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Volume</span>
                    <span className="font-medium">${Math.round(market.volume).toLocaleString()}</span>
                  </div>
                  {market.end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ends</span>
                      <span className="font-medium">{new Date(market.end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/markets/${market.polymarket_id}/predictions`}
                    className="polynet-btn polynet-btn-secondary flex-1 text-sm"
                  >
                    AI Predictions
                  </Link>
                  <a
                    href={`https://polymarket.com/event/${market.market_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="polynet-btn polynet-btn-ghost text-sm"
                  >
                    View →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
