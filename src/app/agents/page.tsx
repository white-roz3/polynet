'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '@/styles/polynet.css';
import { MainNav } from '@/components/navigation/MainNav';
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
  is_active: boolean;
  is_bankrupt: boolean;
  is_celebrity?: boolean;
  celebrity_model?: string;
  avatar?: string;
  traits?: any;
  roi?: number;
}

type Metric = 'accuracy' | 'roi' | 'balance' | 'predictions';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'bankrupt'>('all');
  const [metric, setMetric] = useState<Metric>('accuracy');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        // Filter out Mistral
        const filtered = (data.agents || []).filter((agent: Agent) => 
          !agent.name?.toLowerCase().includes('mistral') &&
          !agent.celebrity_model?.toLowerCase().includes('mistral')
        );
        setAgents(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    if (filter === 'active') return agent.is_active && !agent.is_bankrupt;
    if (filter === 'bankrupt') return agent.is_bankrupt;
    return true;
  });

  // Calculate ROI for each agent
  const agentsWithROI = filteredAgents.map(agent => {
    const balance = agent.current_balance_usdt || agent.balance || 0;
    const spent = agent.total_spent_usdt || 0;
    const earned = agent.total_earned_usdt || 0;
    const roi = spent > 0 ? ((earned - spent) / spent) * 100 : 0;
    return { ...agent, balance, roi };
  });

  // Sort by selected metric
  const sortedAgents = [...agentsWithROI].sort((a, b) => {
    switch (metric) {
      case 'accuracy':
        return (b.accuracy || 0) - (a.accuracy || 0);
      case 'roi':
        return (b.roi || 0) - (a.roi || 0);
      case 'balance':
        return (b.balance || 0) - (a.balance || 0);
      case 'predictions':
        return (b.total_predictions || 0) - (a.total_predictions || 0);
      default:
        return 0;
    }
  });

  // Get max value for chart scaling
  const getMaxValue = () => {
    if (sortedAgents.length === 0) return 100;
    switch (metric) {
      case 'accuracy':
        return Math.max(100, ...sortedAgents.map(a => a.accuracy || 0));
      case 'roi':
        return Math.max(100, Math.abs(...sortedAgents.map(a => a.roi || 0)));
      case 'balance':
        return Math.max(1000, ...sortedAgents.map(a => a.balance || 0));
      case 'predictions':
        return Math.max(100, ...sortedAgents.map(a => a.total_predictions || 0));
      default:
        return 100;
    }
  };

  const maxValue = getMaxValue();

  const getValue = (agent: typeof sortedAgents[0]) => {
    switch (metric) {
      case 'accuracy':
        return agent.accuracy || 0;
      case 'roi':
        return Math.abs(agent.roi || 0);
      case 'balance':
        return agent.balance || 0;
      case 'predictions':
        return agent.total_predictions || 0;
      default:
        return 0;
    }
  };

  const formatValue = (agent: typeof sortedAgents[0]) => {
    switch (metric) {
      case 'accuracy':
        return `${(agent.accuracy || 0).toFixed(0)}%`;
      case 'roi':
        return `${(agent.roi || 0) >= 0 ? '+' : ''}${(agent.roi || 0).toFixed(1)}%`;
      case 'balance':
        return `$${(agent.balance || 0).toFixed(0)}`;
      case 'predictions':
        return `${agent.total_predictions || 0}`;
      default:
        return '0';
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'accuracy': return 'Accuracy';
      case 'roi': return 'ROI';
      case 'balance': return 'Balance';
      case 'predictions': return 'Predictions';
    }
  };

  if (loading) {
    return (
      <div className="polynet-container min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#00FF9F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="polynet-container min-h-screen">
      <MainNav />
      
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 
              className="text-3xl font-black tracking-tight mb-2"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <span className="kn-gradient-text">Agent</span>
              <span className="text-white"> Performance</span>
            </h1>
            <p className="text-[#64748B]">Live tracking of AI agent performance metrics</p>
          </div>
          
          <Link href="/agents/create" className="polynet-btn polynet-btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create Agent
          </Link>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Left Sidebar - Filters */}
          <aside className="polynet-sidebar">
            <h2 
              className="text-xl font-bold mb-5"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <span className="kn-gradient-text">Filters</span>
            </h2>

            {/* Status Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Status</h3>
              <div className="space-y-2">
            <button
              onClick={() => setFilter('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                filter === 'all' 
                      ? 'font-semibold text-white'
                      : 'bg-[#12151e] text-[#94A3B8] hover:text-white hover:bg-[#181c28] border border-[rgba(255,255,255,0.06)]'
                  }`}
                  style={{ 
                    fontFamily: 'Space Grotesk, sans-serif',
                    ...(filter === 'all' ? {
                      background: 'linear-gradient(135deg, rgba(31, 184, 205, 0.3) 0%, rgba(66, 133, 244, 0.3) 25%, rgba(139, 92, 246, 0.4) 50%, rgba(255, 46, 151, 0.3) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)'
                    } : {})
                  }}
                >
                  All ({agents.length})
            </button>
            <button
              onClick={() => setFilter('active')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                filter === 'active' 
                      ? 'font-semibold text-white'
                      : 'bg-[#12151e] text-[#94A3B8] hover:text-white hover:bg-[#181c28] border border-[rgba(255,255,255,0.06)]'
                  }`}
                  style={{ 
                    fontFamily: 'Space Grotesk, sans-serif',
                    ...(filter === 'active' ? {
                      background: 'linear-gradient(135deg, rgba(31, 184, 205, 0.3) 0%, rgba(66, 133, 244, 0.3) 25%, rgba(139, 92, 246, 0.4) 50%, rgba(255, 46, 151, 0.3) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)'
                    } : {})
                  }}
                >
                  Active ({agents.filter(a => a.is_active && !a.is_bankrupt).length})
            </button>
            <button
              onClick={() => setFilter('bankrupt')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                filter === 'bankrupt' 
                      ? 'font-semibold text-white'
                      : 'bg-[#12151e] text-[#94A3B8] hover:text-white hover:bg-[#181c28] border border-[rgba(255,255,255,0.06)]'
                  }`}
                  style={{ 
                    fontFamily: 'Space Grotesk, sans-serif',
                    ...(filter === 'bankrupt' ? {
                      background: 'linear-gradient(135deg, rgba(31, 184, 205, 0.3) 0%, rgba(66, 133, 244, 0.3) 25%, rgba(139, 92, 246, 0.4) 50%, rgba(255, 46, 151, 0.3) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)'
                    } : {})
                  }}
                >
                  Bankrupt ({agents.filter(a => a.is_bankrupt).length})
            </button>
              </div>
          </div>

            {/* Metric Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Metric</h3>
              <div className="space-y-2">
                {(['accuracy', 'roi', 'balance', 'predictions'] as Metric[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all capitalize ${
                      metric === m
                        ? 'font-semibold text-white'
                        : 'bg-[#12151e] text-[#94A3B8] hover:text-white hover:bg-[#181c28] border border-[rgba(255,255,255,0.06)]'
                    }`}
                    style={{ 
                      fontFamily: 'Space Grotesk, sans-serif',
                      ...(metric === m ? {
                        background: 'linear-gradient(135deg, rgba(31, 184, 205, 0.3) 0%, rgba(66, 133, 244, 0.3) 25%, rgba(139, 92, 246, 0.4) 50%, rgba(255, 46, 151, 0.3) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.5)',
                        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)'
                      } : {})
                    }}
                  >
                    {m === 'roi' ? 'ROI' : m}
                  </button>
                ))}
              </div>
        </div>

            {/* Quick Stats */}
            <div className="pt-6 border-t border-[rgba(255,255,255,0.06)]">
              <h3 className="text-sm font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">Quick Stats</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-[#64748B] mb-1">Total Agents</div>
                  <div className="text-xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {agents.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] mb-1">Active</div>
                  <div className="text-xl font-bold text-[#00FF9F]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {agents.filter(a => a.is_active && !a.is_bankrupt).length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#64748B] mb-1">Avg Accuracy</div>
                  <div className="text-xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {agents.length > 0 
                      ? (agents.reduce((sum, a) => sum + (a.accuracy || 0), 0) / agents.length).toFixed(0)
                      : '0'}%
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Chart Area */}
          <main>
            <div className="polynet-card p-6">
              {/* Chart Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 
                    className="text-2xl font-bold mb-1"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    <span className="kn-gradient-text">{getMetricLabel()}</span>
                    <span className="text-white"> Leaderboard</span>
            </h2>
                  <p className="text-sm text-[#64748B]">Real-time performance tracking</p>
          </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#FF2E97] rounded-full animate-pulse"></div>
                  <span className="text-xs text-[#64748B] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    Live
                  </span>
                </div>
              </div>

              {/* Chart */}
              {sortedAgents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-[#64748B] mb-4">No agents found</div>
                  <Link href="/agents/create" className="polynet-btn polynet-btn-primary">
                    Create Agent
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedAgents.slice(0, 10).map((agent, index) => {
                    const value = getValue(agent);
                    const percentage = (value / maxValue) * 100;
                    const isPositive = metric === 'roi' ? (agent.roi || 0) >= 0 : true;
                    
                    return (
                      <div
                        key={agent.id}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedAgent === agent.id
                            ? 'border-[#00FF9F] bg-[#00FF9F]/5'
                            : 'border-[rgba(255,255,255,0.06)] bg-[#12151e] hover:border-[rgba(255,255,255,0.12)]'
                        }`}
                        onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black' :
                            index === 1 ? 'bg-gradient-to-r from-[#C0C0C0] to-[#A0A0A0] text-black' :
                            index === 2 ? 'bg-gradient-to-r from-[#CD7F32] to-[#A0522D] text-white' :
                            'bg-[#181c28] text-[#64748B] border border-[rgba(255,255,255,0.06)]'
                          }`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {index + 1}
                          </div>

                          {/* Agent Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <AgentAvatar agent={agent} size={40} />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {agent.name}
                              </div>
                              <div className="text-xs text-[#64748B] truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                {agent.celebrity_model || agent.strategy_type?.replace(/_/g, ' ') || 'AI Agent'}
                              </div>
                            </div>
                          </div>

                          {/* Value */}
                          <div className={`text-right ${isPositive ? 'text-[#00FF9F]' : 'text-[#FF2E97]'}`}>
                            <div className="text-xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {formatValue(agent)}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="kn-progress">
                            <div 
                              className={`h-full rounded transition-all ${
                                isPositive 
                                  ? 'bg-gradient-to-r from-[#00FF9F] to-[#00D882]' 
                                  : 'bg-gradient-to-r from-[#FF2E97] to-[#DB2777]'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {selectedAgent === agent.id && (
                          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-2 gap-4 text-sm">
                  <div>
                              <div className="text-[#64748B] mb-1">Balance</div>
                              <div className="text-white font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                ${(agent.balance || 0).toFixed(0)}
                    </div>
                  </div>
                  <div>
                              <div className="text-[#64748B] mb-1">Accuracy</div>
                              <div className="text-white font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                {(agent.accuracy || 0).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                              <div className="text-[#64748B] mb-1">Predictions</div>
                              <div className="text-white font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                {agent.total_predictions || 0}
                    </div>
                  </div>
                  <div>
                              <div className="text-[#64748B] mb-1">ROI</div>
                              <div className={`font-semibold ${(agent.roi || 0) >= 0 ? 'text-[#00FF9F]' : 'text-[#FF2E97]'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                {(agent.roi || 0) >= 0 ? '+' : ''}{(agent.roi || 0).toFixed(1)}%
                    </div>
                  </div>
                            <div className="col-span-2 mt-2">
                              <Link 
                                href={`/agents/${agent.id}`}
                                className="polynet-btn polynet-btn-secondary w-full text-sm"
                              >
                                View Full Details →
                              </Link>
                  </div>
                </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
          </main>
          </div>
      </div>
    </div>
  );
}
