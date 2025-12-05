'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '@/styles/kalshinet.css';
import { MainNav } from '@/components/navigation/MainNav';
import CreateAgentModal from '@/components/CreateAgentModal';
import { ModelIcon, AgentAvatar } from '@/components/ModelIcon';

interface Agent {
  id: string;
  name: string;
  strategy_type?: string;
  strategy?: string;
  current_balance_usdt?: number;
  balance?: number;
  total_spent_usdt?: number;
  total_earned_usdt?: number;
  accuracy: number;
  total_predictions: number;
  roi?: number;
  is_active: boolean;
  is_bankrupt: boolean;
  is_celebrity?: boolean;
  celebrity_model?: string;
  avatar?: string;
  traits?: any;
}

interface Market {
  id: string;
  ticker?: string;
  event_ticker?: string;
  question: string;
  subtitle?: string;
  description?: string;
  outcomePrices?: number[];
  outcomes?: string[];
  volume?: string | number;
  volume_24h?: number;
  liquidity?: string;
  endDate?: string;
  end_date?: string;
  close_time?: string;
  marketSlug?: string;
  yes_price?: number;
  no_price?: number;
  yes_ask?: number;
  no_ask?: number;
  last_price?: number;
  total_volume?: number;
  open_interest?: number;
  category?: string;
  status?: string;
}

interface Prediction {
  id: string;
  agent_id: string;
  market_id: string;
  prediction: string;
  confidence: number;
  reasoning?: string;
  created_at: string;
  agent_name?: string;
  agent_avatar?: string;
}

type SortOption = 'accuracy' | 'roi' | 'predictions' | 'balance';

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('accuracy');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'markets' | 'analysis'>('markets');

  useEffect(() => {
    Promise.all([fetchAgents(), fetchMarkets(), fetchPredictions()])
      .finally(() => setLoading(false));
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMarkets();
      fetchPredictions();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        // Filter out Mistral and ensure DeepSeek is present
        const agents = (data.agents || []).filter((agent: Agent) => 
          !agent.name?.toLowerCase().includes('mistral') &&
          !agent.celebrity_model?.toLowerCase().includes('mistral')
        );
        setAgents(agents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchMarkets = async () => {
    try {
      // Fetch from Kalshi API
      const response = await fetch('/api/kalshi/markets?limit=30&status=open');
      const data = await response.json();
      
      if (data.success && data.markets?.length > 0) {
        setMarkets(data.markets);
        return;
      }
      
      // Fallback to local database if Kalshi fails
      const fallbackResponse = await fetch('/api/markets/list');
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.success && fallbackData.markets?.length > 0) {
        const transformedMarkets = fallbackData.markets.map((m: any) => ({
          id: m.id || m.polymarket_id,
          question: m.question,
          description: m.description,
          outcomePrices: [m.yes_price || 0.5, m.no_price || 0.5],
          volume: (m.volume || 0).toString(),
          endDate: m.end_date,
          marketSlug: m.slug || m.market_slug,
          yes_price: m.yes_price,
          no_price: m.no_price,
          total_volume: m.volume,
          category: m.category
        }));
        setMarkets(transformedMarkets);
      }
    } catch (error) {
      console.error('Failed to fetch markets:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/predictions/list?limit=100&sortBy=created_at&sortOrder=desc');
      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions || []);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    }
  };

  // Sort agents based on selected criteria
  const sortedAgents = [...agents].sort((a, b) => {
    switch (sortBy) {
      case 'accuracy':
        return (b.accuracy || 0) - (a.accuracy || 0);
      case 'roi':
        return (b.roi || 0) - (a.roi || 0);
      case 'predictions':
        return (b.total_predictions || 0) - (a.total_predictions || 0);
      case 'balance':
        return (b.current_balance_usdt || b.balance || 0) - (a.current_balance_usdt || a.balance || 0);
      default:
        return 0;
    }
  });

  // Get predictions for a specific market
  const getMarketPredictions = (marketId: string) => {
    return predictions.filter(p => p.market_id === marketId);
  };

  // Get agent info by ID
  const getAgent = (agentId: string) => {
    return agents.find(a => a.id === agentId);
  };

  // Get rank badge styling
  const getRankBadge = (index: number) => {
    if (index === 0) return { icon: '🥇', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' };
    if (index === 1) return { icon: '🥈', bg: 'bg-gray-400/20', border: 'border-gray-400/50', text: 'text-gray-300' };
    if (index === 2) return { icon: '🥉', bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' };
    return { icon: `${index + 1}`, bg: 'bg-[#1e2235]', border: 'border-[#2a2f42]', text: 'text-gray-500' };
  };

  if (loading) {
  return (
      <div className="kalshinet-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kalshinet-container min-h-screen">
      <MainNav />
      
      <div className="flex">
        {/* Left Sidebar - Agent Rankings */}
        <aside className="w-80 min-h-[calc(100vh-72px)] border-r border-[rgba(255,255,255,0.06)] bg-[#0a0b10]/80 backdrop-blur-xl flex-shrink-0 sticky top-[72px] overflow-y-auto max-h-[calc(100vh-72px)]">
          <div className="p-5">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 
                className="text-xl font-bold"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                <span className="kn-gradient-text">Agent</span>
                <span className="text-white"> Rankings</span>
              </h2>
              <span className="kn-tag kn-tag-violet">{agents.length}</span>
            </div>

            {/* Sort Options */}
            <div className="flex flex-wrap gap-2 mb-5">
              {(['accuracy', 'roi', 'predictions', 'balance'] as SortOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    sortBy === option
                      ? 'text-white'
                      : 'bg-[#12151e] text-[#94A3B8] hover:text-white hover:bg-[#181c28] border border-[rgba(255,255,255,0.06)]'
                  }`}
        style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    ...(sortBy === option ? {
                      background: 'linear-gradient(135deg, rgba(31, 184, 205, 0.3) 0%, rgba(66, 133, 244, 0.3) 25%, rgba(139, 92, 246, 0.4) 50%, rgba(255, 46, 151, 0.3) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)'
                    } : {})
                  }}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>

            {/* Agent List */}
            <div className="space-y-3">
              {sortedAgents.map((agent, index) => {
                const balance = agent.current_balance_usdt || agent.balance || 0;
                const isActive = agent.is_active && !agent.is_bankrupt;
                
                // Rank styling
                const rankStyle = index === 0 
                  ? 'kn-rank kn-rank-1' 
                  : index === 1 
                    ? 'kn-rank kn-rank-2' 
                    : index === 2 
                      ? 'kn-rank kn-rank-3' 
                      : 'kn-rank kn-rank-default';
                
                return (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className={`kn-agent-card block ${
                      agent.is_bankrupt ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className={rankStyle}>
                        {index + 1}
                      </div>
                      
                      {/* Avatar - Model Icon */}
                      <AgentAvatar agent={agent} size={28} />
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {agent.name}
                        </div>
                        <div className="text-xs text-[#64748B] truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {agent.celebrity_model || agent.strategy_type?.replace(/_/g, ' ') || 'AI Agent'}
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className={`kn-agent-status ${!isActive ? 'inactive' : ''}`} />
            </div>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                      <div className="text-center">
                        <div 
                          className={`text-sm font-bold ${sortBy === 'accuracy' ? 'text-[#00FF9F]' : 'text-white'}`}
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {(agent.accuracy || 0).toFixed(0)}%
                        </div>
                        <div className="text-[9px] text-[#475569] uppercase tracking-wider">Acc</div>
                      </div>
                      <div className="text-center">
                        <div 
                          className={`text-sm font-bold ${
                            sortBy === 'roi' 
                              ? (agent.roi || 0) >= 0 ? 'text-[#00FF9F]' : 'text-[#FF2E97]'
                              : 'text-white'
                          }`}
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {(agent.roi || 0) >= 0 ? '+' : ''}{(agent.roi || 0).toFixed(0)}%
                        </div>
                        <div className="text-[9px] text-[#475569] uppercase tracking-wider">ROI</div>
                      </div>
                      <div className="text-center">
                        <div 
                          className={`text-sm font-bold ${sortBy === 'predictions' ? 'text-[#00FF9F]' : 'text-white'}`}
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {agent.total_predictions || 0}
                        </div>
                        <div className="text-[9px] text-[#475569] uppercase tracking-wider">Pred</div>
                      </div>
                      <div className="text-center">
                        <div 
                          className={`text-sm font-bold ${sortBy === 'balance' ? 'text-[#00FF9F]' : 'text-white'}`}
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          ${balance.toFixed(0)}
                        </div>
                        <div className="text-[9px] text-[#475569] uppercase tracking-wider">Bal</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-2 px-4 bg-[#00C853] text-black font-semibold rounded-lg hover:bg-[#00E676] transition-colors text-sm"
              >
                + Create Agent
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content - Markets & Activity */}
        <main className="flex-1 p-6">
          {/* Header with Tabs */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 
                  className="text-3xl font-black tracking-tight mb-2"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  <span className="kn-gradient-text">Market</span>
                  <span className="text-white"> Intelligence</span>
                </h1>
                <p className="text-[#64748B] text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Real-time markets and AI-powered analysis
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="kn-live">
                  LIVE
                </div>
                <button
                  onClick={() => { fetchMarkets(); fetchPredictions(); }}
                  className="kalshinet-btn kalshinet-btn-secondary"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => setActiveTab('markets')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'markets' ? 'text-white' : 'text-[#64748B] hover:text-white'
                }`}
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Active Markets
                {activeTab === 'markets' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1FB8CD] via-[#4285F4] to-[#8B5CF6]"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'analysis' ? 'text-white' : 'text-[#64748B] hover:text-white'
                }`}
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Analysis
                {activeTab === 'analysis' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1FB8CD] via-[#4285F4] to-[#8B5CF6]"></div>
                )}
              </button>
            </div>
          </div>

          {/* Markets Tab */}
          {activeTab === 'markets' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
            {markets.map(market => {
              const marketPredictions = getMarketPredictions(market.id);
              const yesPrice = market.yes_price || market.outcomePrices?.[0] || 0.5;
              const noPrice = market.no_price || market.outcomePrices?.[1] || (1 - yesPrice);
              const yesPct = (yesPrice * 100).toFixed(0);
              const noPct = (noPrice * 100).toFixed(0);
              const volume = typeof market.volume === 'string' ? parseFloat(market.volume) : (market.volume || market.total_volume || 0);
              const volume24h = market.volume_24h || 0;
              const yesPredictions = marketPredictions.filter(p => p.prediction === 'YES');
              const noPredictions = marketPredictions.filter(p => p.prediction === 'NO');
              const isExpanded = selectedMarket === market.id;
              const endDate = market.end_date || market.endDate || market.close_time;
              
              return (
                <div
                  key={market.id}
                  className={`group bg-[#12151e] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden transition-all hover:border-[rgba(255,255,255,0.12)] hover:shadow-xl hover:shadow-black/20 ${
                    isExpanded ? 'ring-2 ring-[#00FF9F]/40 col-span-full' : ''
                  }`}
                >
                  {/* Market Card */}
                  <div 
                    className="p-5 cursor-pointer"
                    onClick={() => setSelectedMarket(isExpanded ? null : market.id)}
                  >
                    {/* Category & Ticker Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      {market.category && (
                        <span className="kn-tag kn-tag-violet">{market.category}</span>
                      )}
                      {market.ticker && (
                        <span className="kn-tag kn-tag-mint">{market.ticker}</span>
                      )}
                  </div>

                    {/* Question */}
                    <h3 
                      className="text-white font-semibold text-base leading-snug mb-4 line-clamp-2 min-h-[2.75rem] group-hover:text-[#00FF9F] transition-colors"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {market.question}
                    </h3>
                    
                    {/* Big Odds Display */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div 
                            className="text-2xl font-bold text-[#00FF9F]"
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                          >
                            {yesPct}%
                          </div>
                          <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Yes</div>
                        </div>
                        <div className="w-px h-10 bg-[rgba(255,255,255,0.1)]" />
                        <div className="text-center">
                          <div 
                            className="text-2xl font-bold text-[#FF2E97]"
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                          >
                            {noPct}%
                          </div>
                          <div className="text-[10px] text-[#64748B] uppercase tracking-wider">No</div>
                        </div>
                  </div>

                      {/* Agent Icons */}
                      {marketPredictions.length > 0 && (
                        <div className="flex items-center">
                          {marketPredictions.slice(0, 3).map((pred, i) => {
                            const agent = getAgent(pred.agent_id);
                            return (
                              <div
                                key={pred.id}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center border bg-[#0a0b10] ${
                                  pred.prediction === 'YES'
                                    ? 'border-[#00FF9F]/40'
                                    : 'border-[#FF2E97]/40'
                                }`}
                                style={{ marginLeft: i > 0 ? '-4px' : 0, zIndex: 5 - i }}
                                title={`${agent?.name || 'Agent'}: ${pred.prediction}`}
                              >
                                <ModelIcon model={agent?.celebrity_model || agent?.name || ''} size={16} />
                              </div>
                            );
                          })}
                          {marketPredictions.length > 3 && (
                            <div 
                              className="w-7 h-7 rounded-lg bg-[#0a0b10] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[10px] text-[#64748B] -ml-1"
                              style={{ fontFamily: 'JetBrains Mono, monospace' }}
                            >
                              +{marketPredictions.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                    {/* Progress Bar */}
                    <div className="kn-progress mb-4">
                      <div 
                        className="kn-progress-yes"
                        style={{ width: `${yesPct}%` }}
                      />
                  </div>

                    {/* Meta Row */}
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        Vol: {volume >= 1000000 ? `$${(volume/1000000).toFixed(1)}M` : volume >= 1000 ? `$${(volume/1000).toFixed(0)}K` : `$${Math.floor(volume)}`}
                      </span>
                      {volume24h > 1000 && (
                        <span className="text-[#00FF9F]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          +{volume24h >= 1000000 ? `$${(volume24h/1000000).toFixed(1)}M` : `$${(volume24h/1000).toFixed(0)}K`} 24h
                        </span>
                      )}
                      {endDate && (
                        <span>
                          {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && marketPredictions.length > 0 && (
                    <div className="px-5 pb-5 border-t border-[rgba(255,255,255,0.06)]">
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        {/* YES Camp */}
                        <div className="p-4 rounded-xl bg-[#00FF9F]/5 border border-[#00FF9F]/20">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF9F]" />
                            <span className="text-[#00FF9F] font-semibold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>YES ({yesPredictions.length})</span>
                          </div>
                          <div className="space-y-2">
                            {yesPredictions.length === 0 ? (
                              <p className="text-[#475569] text-xs italic">No YES predictions</p>
                            ) : (
                              yesPredictions.slice(0, 5).map(pred => {
                                const agent = getAgent(pred.agent_id);
                                return (
                                  <div key={pred.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#00FF9F]/5">
                                    <ModelIcon model={agent?.celebrity_model || agent?.name || ''} size={22} />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-white truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{agent?.name || 'Agent'}</div>
                                      <div className="text-xs text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{(pred.confidence * 100).toFixed(0)}%</div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                  </div>
                </div>

                        {/* NO Camp */}
                        <div className="p-4 rounded-xl bg-[#FF2E97]/5 border border-[#FF2E97]/20">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FF2E97]" />
                            <span className="text-[#FF2E97] font-semibold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NO ({noPredictions.length})</span>
                          </div>
                          <div className="space-y-2">
                            {noPredictions.length === 0 ? (
                              <p className="text-[#475569] text-xs italic">No NO predictions</p>
                            ) : (
                              noPredictions.slice(0, 5).map(pred => {
                                const agent = getAgent(pred.agent_id);
                                return (
                                  <div key={pred.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#FF2E97]/5">
                                    <ModelIcon model={agent?.celebrity_model || agent?.name || ''} size={22} />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-white truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{agent?.name || 'Agent'}</div>
                                      <div className="text-xs text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{(pred.confidence * 100).toFixed(0)}%</div>
                                    </div>
                </div>
                                );
                              })
                            )}
                  </div>
                </div>
              </div>

                      {/* View on Polymarket */}
                      {market.marketSlug && (
                        <a
                          href={`https://polymarket.com/event/${market.marketSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 text-sm text-[#00FF9F] hover:text-white transition-colors"
                          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                          Trade on Polymarket →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {markets.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-[#64748B] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>No active markets found</div>
                <button
                  onClick={fetchMarkets}
                  className="kalshinet-btn kalshinet-btn-secondary"
                >
                  Refresh Markets
                </button>
              </div>
            )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {markets.slice(0, 10).map(market => {
                const marketPredictions = getMarketPredictions(market.id);
                const yesPredictions = marketPredictions.filter(p => p.prediction === 'YES');
                const noPredictions = marketPredictions.filter(p => p.prediction === 'NO');
                const yesPrice = market.yes_price || market.outcomePrices?.[0] || 0.5;
                const noPrice = market.no_price || market.outcomePrices?.[1] || (1 - yesPrice);
                const yesPct = (yesPrice * 100).toFixed(0);
                const noPct = (noPrice * 100).toFixed(0);
                const totalPredictions = marketPredictions.length;
                const yesConfidence = yesPredictions.length > 0 
                  ? yesPredictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / yesPredictions.length 
                  : 0;
                const noConfidence = noPredictions.length > 0
                  ? noPredictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / noPredictions.length
                  : 0;

                // Analyze reasons for YES
                const yesReasons = [
                  ...yesPredictions.map(p => p.reasoning).filter(Boolean),
                  ...yesPredictions.map(p => `Agent confidence: ${((p.confidence || 0) * 100).toFixed(0)}%`),
                ].slice(0, 5);

                // Analyze reasons for NO
                const noReasons = [
                  ...noPredictions.map(p => p.reasoning).filter(Boolean),
                  ...noPredictions.map(p => `Agent confidence: ${((p.confidence || 0) * 100).toFixed(0)}%`),
                ].slice(0, 5);

                return (
                  <div key={market.id} className="kalshinet-card p-6">
                    {/* Market Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {market.category && (
                            <span className="kn-tag kn-tag-violet">{market.category}</span>
                          )}
                          {market.ticker && (
                            <span className="kn-tag kn-tag-mint">{market.ticker}</span>
                          )}
                          {totalPredictions > 0 && (
                            <span className="kn-tag kn-tag-pink">
                              {totalPredictions} prediction{totalPredictions !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h3 
                          className="text-xl font-bold text-white mb-2"
                          style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                          {market.question}
                        </h3>
                        <div className="flex items-center gap-4 text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          <span className="text-[#00FF9F]">YES: {yesPct}%</span>
                          <span className="text-[#FF2E97]">NO: {noPct}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* YES Analysis */}
                      <div className="p-5 rounded-xl bg-[#00FF9F]/5 border border-[#00FF9F]/20">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 rounded-full bg-[#00FF9F]"></div>
                          <h4 className="text-lg font-bold text-[#00FF9F]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Why YES? ({yesPredictions.length})
                          </h4>
                        </div>
                        {yesPredictions.length === 0 ? (
                          <p className="text-[#64748B] text-sm italic">No YES predictions yet</p>
                        ) : (
                          <div className="space-y-3">
                            {yesReasons.length > 0 ? (
                              yesReasons.map((reason, idx) => (
                                <div key={idx} className="text-sm text-white leading-relaxed">
                                  <span className="text-[#00FF9F] mr-2">•</span>
                                  {reason.length > 200 ? `${reason.substring(0, 200)}...` : reason}
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-white">
                                <span className="text-[#00FF9F] mr-2">•</span>
                                Average agent confidence: {(yesConfidence * 100).toFixed(0)}%
                              </div>
                            )}
                            {yesPredictions.length > 0 && (
                              <div className="pt-3 border-t border-[#00FF9F]/20">
                                <div className="text-xs text-[#64748B]">
                                  {yesPredictions.length} agent{yesPredictions.length !== 1 ? 's' : ''} predicting YES
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* NO Analysis */}
                      <div className="p-5 rounded-xl bg-[#FF2E97]/5 border border-[#FF2E97]/20">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 rounded-full bg-[#FF2E97]"></div>
                          <h4 className="text-lg font-bold text-[#FF2E97]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Why NO? ({noPredictions.length})
                          </h4>
                        </div>
                        {noPredictions.length === 0 ? (
                          <p className="text-[#64748B] text-sm italic">No NO predictions yet</p>
                        ) : (
                          <div className="space-y-3">
                            {noReasons.length > 0 ? (
                              noReasons.map((reason, idx) => (
                                <div key={idx} className="text-sm text-white leading-relaxed">
                                  <span className="text-[#FF2E97] mr-2">•</span>
                                  {reason.length > 200 ? `${reason.substring(0, 200)}...` : reason}
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-white">
                                <span className="text-[#FF2E97] mr-2">•</span>
                                Average agent confidence: {(noConfidence * 100).toFixed(0)}%
                              </div>
                            )}
                            {noPredictions.length > 0 && (
                              <div className="pt-3 border-t border-[#FF2E97]/20">
                                <div className="text-xs text-[#64748B]">
                                  {noPredictions.length} agent{noPredictions.length !== 1 ? 's' : ''} predicting NO
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Market Summary */}
                    {totalPredictions > 0 && (
                      <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-[#64748B]">Total Analysis: </span>
                            <span className="text-white font-semibold">{totalPredictions} agent prediction{totalPredictions !== 1 ? 's' : ''}</span>
                          </div>
                          {market.marketSlug && (
                            <a
                              href={`https://polymarket.com/event/${market.marketSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#8B5CF6] hover:text-white transition-colors"
                              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                            >
                              View on Polymarket →
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {markets.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-[#64748B] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    No markets available for analysis
                  </div>
                  <button
                    onClick={fetchMarkets}
                    className="kalshinet-btn kalshinet-btn-secondary"
                  >
                    Refresh Markets
                  </button>
                </div>
              )}
            </div>
        )}
        </main>
      </div>
      
      {/* Modals */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchAgents}
      />
    </div>
  );
}
