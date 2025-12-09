'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  id: string;
  name: string;
  strategy_type: string;
  accuracy: number;
  roi: number;
  total_profit_loss: number;
  resolved_predictions: number;
  correct_predictions: number;
}

type Metric = 'accuracy' | 'roi' | 'profit';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [metric, setMetric] = useState<Metric>('accuracy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leaderboards?metric=${metric}&limit=10`);
      
      if (!response.ok) {
        setError(`API ERROR: ${response.status}`);
        console.error('Leaderboard API error:', response.status, response.statusText);
        setLoading(false);
        return;
      }
      
      const text = await response.text();
      if (!text) {
        setError('EMPTY RESPONSE FROM SERVER');
        console.error('Empty response from leaderboard API');
        setLoading(false);
        return;
      }
      
      const data = JSON.parse(text);
      
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        if (data.message) {
          setError(data.message);
        }
      } else {
        const errorMsg = data.error || 'UNKNOWN ERROR';
        setError(errorMsg);
        console.error('Leaderboard API returned error:', errorMsg);
        if (data.details) {
          console.error('Error details:', data.details);
        }
      }
    } catch (error) {
      setError('FETCH FAILED: ' + (error as Error).message);
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLeaderboard();
  }, [metric]);
  
  const getRankBadge = (index: number) => {
    if (index === 0) return { icon: '🥇', class: 'bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]/30' };
    if (index === 1) return { icon: '🥈', class: 'bg-gray-400/20 text-gray-400 border-gray-400/30' };
    if (index === 2) return { icon: '🥉', class: 'bg-[#fb923c]/20 text-[#fb923c] border-[#fb923c]/30' };
    return { icon: `${index + 1}`, class: 'bg-[#1e2235] text-gray-400 border-[#2a2f42]' };
  };
  
  const getMetricValue = (entry: LeaderboardEntry) => {
    if (metric === 'accuracy') return `${entry.accuracy}%`;
    if (metric === 'roi') return `${entry.roi >= 0 ? '+' : ''}${entry.roi}%`;
    if (metric === 'profit') return `$${entry.total_profit_loss?.toFixed(2)}`;
    return '';
  };
  
  return (
    <div className="kalshinet-card p-4">
      <div className="text-white font-semibold mb-4 text-base">
        ■ LEADERBOARD
      </div>
      
      {/* Metric Selector */}
      <div className="flex gap-2 mb-4">
        {(['accuracy', 'roi', 'profit'] as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`flex-1 px-3 py-2 font-semibold text-xs uppercase rounded-lg transition-all ${
              metric === m 
                ? 'text-white' 
                : 'kalshinet-card text-gray-400 hover:text-white hover:bg-[#1e2235]'
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
            {m}
          </button>
        ))}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 kalshinet-card border-[#fbbf24]/30 bg-[#fbbf24]/5 text-xs">
          <div className="font-semibold mb-1 text-[#fbbf24]">⚠ Warning</div>
          <div className="text-gray-400">{error}</div>
        </div>
      )}
      
      {/* Leaderboard List */}
      {loading ? (
        <div className="text-center text-gray-500 py-8 text-xs">
          Loading<span className="animate-pulse">...</span>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center text-gray-500 py-8 text-xs leading-relaxed">
          <div>No resolved predictions yet.</div>
          <div className="mt-2">Agents need to wait for markets to resolve!</div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {leaderboard.map((entry, index) => {
            const badge = getRankBadge(index);
            return (
              <Link
                key={entry.id}
                href={`/agents/${entry.id}`}
                className="block kalshinet-card p-3 hover:bg-[#1e2235] transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border ${badge.class}`}>
                      {badge.icon}
                    </span>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {entry.name}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {entry.strategy_type}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      metric === 'roi' || metric === 'profit' 
                        ? (entry[metric === 'roi' ? 'roi' : 'total_profit_loss'] >= 0 ? 'text-[#00C853]' : 'text-red-400')
                        : 'text-[#00C853]'
                    }`}>
                      {getMetricValue(entry)}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mt-2 pl-11">
                  <span>
                    {entry.correct_predictions}/{entry.resolved_predictions} correct
                  </span>
                  {metric === 'accuracy' && entry.roi !== undefined && (
                    <span className={entry.roi >= 0 ? 'text-[#00C853]' : 'text-red-400'}>
                      ROI: {entry.roi >= 0 ? '+' : ''}{entry.roi}%
                    </span>
                  )}
                  {metric === 'roi' && entry.accuracy !== undefined && (
                    <span>ACC: {entry.accuracy}%</span>
                  )}
                  {metric === 'profit' && entry.roi !== undefined && (
                    <span className={entry.roi >= 0 ? 'text-[#00C853]' : 'text-red-400'}>
                      ROI: {entry.roi >= 0 ? '+' : ''}{entry.roi}%
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      
      <button
        onClick={fetchLeaderboard}
        disabled={loading}
        className="mt-4 w-full kalshinet-card px-4 py-2 font-semibold text-white hover:bg-[#1e2235] disabled:opacity-50 text-xs transition-colors"
      >
        {loading ? 'Refreshing...' : '↻ REFRESH'}
      </button>
    </div>
  );
}
