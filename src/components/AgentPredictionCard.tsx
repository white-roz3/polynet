'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Prediction {
  id: string;
  prediction: string;
  confidence: number;
  reasoning: string;
  created_at: string;
  polymarket_markets: {
    question: string;
    market_slug: string;
  };
}

interface Agent {
  id: string;
  name: string;
  strategy_type?: string;
  strategy?: string;
  current_balance_usdt?: number;
  balance?: number;
  total_predictions: number;
  accuracy: number;
  roi?: number;
  total_profit_loss?: number;
  generation?: number;
  mutations?: string[];
  parent1_id?: string;
  parent2_id?: string;
  is_active: boolean;
  is_bankrupt: boolean;
  is_celebrity?: boolean;
  celebrity_model?: string;
  avatar?: string;
  traits?: any;
}

interface AgentStats {
  accuracy: number;
  roi: number;
  total_profit_loss: number;
  resolved_predictions: number;
  correct_predictions: number;
}

export default function AgentPredictionCard({ agent }: { agent: Agent }) {
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  useEffect(() => {
    fetchLatestPrediction();
    fetchAgentStats();
  }, [agent.id]);
  
  const fetchAgentStats = () => {
    fetch(`/api/agents/${agent.id}/stats`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  };
  
  const fetchLatestPrediction = () => {
    fetch(`/api/predictions?agentId=${agent.id}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.predictions.length > 0) {
          setLatestPrediction(data.predictions[0]);
        }
      })
      .catch(err => console.error('Failed to fetch prediction:', err));
  };
  
  const triggerAnalysis = async () => {
    setAnalyzing(true);
    try {
      await fetch('/api/analyze-trigger', { method: 'POST' });
      setTimeout(() => {
        fetchLatestPrediction();
        setAnalyzing(false);
      }, 5000);
    } catch (error) {
      console.error('Analysis trigger failed:', error);
      setAnalyzing(false);
    }
  };

  const getStrategyColor = () => {
    const colors: Record<string, string> = {
      'CONSERVATIVE': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      'AGGRESSIVE': 'bg-red-500/10 text-red-400 border-red-500/30',
      'SPEED_DEMON': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      'ACADEMIC': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      'BALANCED': 'bg-[#00C853]/10 text-[#00C853] border-[#00C853]/30',
      'DATA_DRIVEN': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      'NEWS_JUNKIE': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      'EXPERT_NETWORK': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      'CONTRARIAN': 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      'MOMENTUM': 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      'SOCIAL_SENTIMENT': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    };
    return colors[agent.strategy_type || agent.strategy || ''] || 'bg-[#1e2235] text-gray-400 border-[#2a2f42]';
  };

  const getStatusBadge = () => {
    if (agent.is_bankrupt) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/30">Bankrupt</span>;
    }
    if (agent.is_active) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#00C853]/10 text-[#00C853] border border-[#00C853]/30">Active</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#1e2235] text-gray-400 border border-[#2a2f42]">Inactive</span>;
  };
  
  return (
    <Link href={`/agents/${agent.id}`}>
      <div className="polynet-card p-5 cursor-pointer hover:border-[#00C853]/50 transition-all hover:shadow-[0_0_30px_rgba(0,200,83,0.1)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#1e2235] border border-[#2a2f42] flex items-center justify-center text-2xl">
            {agent.avatar || agent.traits?.avatar || '🤖'}
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold">{agent.name}</div>
            <div className="text-gray-500 text-sm">
              {agent.celebrity_model || (agent.strategy_type || agent.strategy || 'AI Agent').replace(/_/g, ' ')}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Strategy Badge */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStrategyColor()}`}>
            {(agent.strategy_type || agent.strategy || 'AI').replace(/_/g, ' ')}
          </span>
          {agent.is_celebrity && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#00C853]/10 text-[#00C853] border border-[#00C853]/30">
              Celebrity AI
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#2a2f42]">
          <div className="text-center">
            <div className="text-xl font-bold text-white">
              ${((agent.current_balance_usdt || agent.balance || 0)).toFixed(0)}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Balance</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#00C853]">{(agent.accuracy || 0).toFixed(0)}%</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">{agent.total_predictions}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Predictions</div>
          </div>
        </div>

        {/* Latest Prediction */}
        {latestPrediction && (
          <div className="mt-4 pt-4 border-t border-[#2a2f42]">
            <div className="text-xs text-gray-500 uppercase font-medium mb-2 tracking-wider">Latest Prediction</div>
            <div className="text-sm text-gray-300 mb-3 line-clamp-2">
              {latestPrediction.polymarket_markets?.question || 'Unknown market'}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#1e2235] rounded-lg p-1">
                <span className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  latestPrediction.prediction === 'YES' 
                    ? 'bg-[#00C853] text-black' 
                    : 'text-gray-500'
                }`}>
                  Yes
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  latestPrediction.prediction === 'NO' 
                    ? 'bg-[#E91E8C] text-white' 
                    : 'text-gray-500'
                }`}>
                  No
                </span>
              </div>
              <div className="text-sm font-medium text-gray-400">
                {(latestPrediction.confidence * 100).toFixed(0)}% confident
              </div>
            </div>
          </div>
        )}

        {/* Performance Stats */}
        {stats && stats.resolved_predictions > 0 && (
          <div className="mt-4 pt-4 border-t border-[#2a2f42]">
            <div className="text-xs text-gray-500 uppercase font-medium mb-3 tracking-wider">Performance</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{stats.accuracy}%</div>
                <div className="text-xs text-gray-500">Win Rate</div>
              </div>
              <div>
                <div className={`text-sm font-semibold ${parseFloat(stats.roi as any) >= 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                  {parseFloat(stats.roi as any) >= 0 ? '+' : ''}{stats.roi}%
                </div>
                <div className="text-xs text-gray-500">ROI</div>
              </div>
              <div>
                <div className={`text-sm font-semibold ${stats.total_profit_loss >= 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                  ${stats.total_profit_loss?.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">P/L</div>
              </div>
            </div>
          </div>
        )}

        {/* Generation & Mutations */}
        {agent.generation && agent.generation > 0 && (
          <div className="mt-4 pt-4 border-t border-[#2a2f42]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-500">Gen {agent.generation}</span>
              {agent.parent1_id && agent.parent2_id && (
                <span className="text-xs text-[#E91E8C]">• Bred</span>
              )}
            </div>
            {agent.mutations && agent.mutations.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {agent.mutations.slice(0, 2).map((mutation: string) => (
                  <span 
                    key={mutation}
                    className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/30"
                  >
                    {mutation.replace(/_/g, ' ').toLowerCase()}
                  </span>
                ))}
                {agent.mutations.length > 2 && (
                  <span className="text-xs px-2 py-0.5 bg-[#1e2235] text-gray-500 rounded-full">
                    +{agent.mutations.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerAnalysis();
          }}
          disabled={analyzing || !agent.is_active}
          className="mt-4 w-full py-3 px-4 rounded-lg bg-[#1e2235] border border-[#2a2f42] text-white text-sm font-semibold hover:bg-[#252a3d] hover:border-[#353b52] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Analyze Now
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
