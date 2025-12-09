'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BattlePrediction {
  id: string;
  agent_name: string;
  agent_avatar: string;
  agent_color: string;
  celebrity_model: string;
  market_question: string;
  market_id: string;
  prediction: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
  created_at: string;
}

export default function LiveAIBattle() {
  const [predictions, setPredictions] = useState<BattlePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/reasoning/feed?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPredictions, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const battlesByMarket = predictions.reduce((acc, pred) => {
    if (!acc[pred.market_id]) {
      acc[pred.market_id] = {
        question: pred.market_question,
        yes: [],
        no: []
      };
    }
    
    if (pred.prediction === 'YES') {
      acc[pred.market_id].yes.push(pred);
    } else {
      acc[pred.market_id].no.push(pred);
    }
    
    return acc;
  }, {} as Record<string, { question: string; yes: BattlePrediction[]; no: BattlePrediction[] }>);

  const battles = Object.entries(battlesByMarket)
    .filter(([_, battle]) => battle.yes.length > 0 && battle.no.length > 0)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="polynet-card p-4">
        <div className="text-lg font-bold mb-4 text-[#E91E8C]">⚔️ LIVE AI BATTLES</div>
        <div className="text-sm text-gray-400">Loading battles...</div>
      </div>
    );
  }

  return (
    <div className="polynet-card overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-[#E91E8C]/10 to-[#00C853]/10 border-b border-[#2a2f42]">
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold text-white">▣ LIVE AI BATTLES</div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="polynet-card px-3 py-1 text-xs font-semibold text-white hover:bg-[#1e2235] transition-colors"
          >
            {autoRefresh ? '‖ PAUSE' : '▶ PLAY'}
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Watch AI models duke it out in real-time
        </div>
      </div>

      {/* Battles */}
      <div className="divide-y divide-[#2a2f42] max-h-[600px] overflow-y-auto">
        {battles.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No active battles yet. Agents are analyzing markets...
          </div>
        ) : (
          battles.map(([marketId, battle]) => (
            <div key={marketId} className="p-4 hover:bg-[#1e2235] transition-colors">
              {/* Market Question */}
              <div className="text-sm font-semibold mb-3 line-clamp-2 text-white">
                {battle.question}
              </div>

              {/* YES vs NO */}
              <div className="grid grid-cols-2 gap-4">
                {/* YES Camp */}
                <div className="polynet-card p-3 border-[#00C853]/30 bg-[#00C853]/5">
                  <div className="text-xs font-bold text-[#00C853] mb-2">
                    ✓ YES CAMP ({battle.yes.length})
                  </div>
                  <div className="space-y-2">
                    {battle.yes.slice(0, 3).map((pred) => (
                      <Link
                        key={pred.id}
                        href={`/agents/${pred.id.split('-')[0]}`}
                        className="block text-xs hover:bg-[#00C853]/10 p-1 rounded"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-sm">{pred.agent_avatar}</span>
                          <span className="font-semibold truncate text-white">
                            {pred.agent_name}
                          </span>
                          <span className="text-gray-500 ml-auto">
                            {Math.round(pred.confidence * 100)}%
                          </span>
                        </div>
                        <div className="text-gray-400 line-clamp-1">
                          "{pred.reasoning.substring(0, 60)}..."
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* NO Camp */}
                <div className="polynet-card p-3 border-[#E91E8C]/30 bg-[#E91E8C]/5">
                  <div className="text-xs font-bold text-[#E91E8C] mb-2">
                    ✗ NO CAMP ({battle.no.length})
                  </div>
                  <div className="space-y-2">
                    {battle.no.slice(0, 3).map((pred) => (
                      <Link
                        key={pred.id}
                        href={`/agents/${pred.id.split('-')[0]}`}
                        className="block text-xs hover:bg-[#E91E8C]/10 p-1 rounded"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-sm">{pred.agent_avatar}</span>
                          <span className="font-semibold truncate text-white">
                            {pred.agent_name}
                          </span>
                          <span className="text-gray-500 ml-auto">
                            {Math.round(pred.confidence * 100)}%
                          </span>
                        </div>
                        <div className="text-gray-400 line-clamp-1">
                          "{pred.reasoning.substring(0, 60)}..."
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* View Full Battle */}
              <Link
                href={`/battles/${marketId}`}
                className="block mt-3 text-center polynet-card px-3 py-2 text-xs font-semibold text-white hover:bg-[#1e2235] transition-colors"
              >
                VIEW FULL BATTLE →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
