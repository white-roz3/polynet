'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CelebrityStats {
  id: string;
  name: string;
  avatar: string;
  color: string;
  celebrity_model: string;
  accuracy: number;
  total_predictions: number;
  balance: number;
  roi: number;
}

export default function CelebrityAIStats() {
  const [celebrities, setCelebrities] = useState<CelebrityStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCelebrities = async () => {
      try {
        const response = await fetch('/api/agents?celebrities=true');
        const data = await response.json();
        
        if (data.success) {
          const stats = data.agents.map((agent: any) => ({
            id: agent.id,
            name: agent.name,
            avatar: agent.traits?.avatar || '🤖',
            color: agent.traits?.color || 'gray',
            celebrity_model: agent.celebrity_model,
            accuracy: agent.accuracy || 0,
            total_predictions: agent.total_predictions || 0,
            balance: agent.balance || 0,
            roi: agent.roi || 0
          }));
          
          setCelebrities(stats);
        }
      } catch (error) {
        console.error('Error fetching celebrity stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCelebrities();
  }, []);

  if (loading) {
    return (
      <div className="polynet-card p-6 mb-6 border-[#00C853]/30">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2 text-[#00C853]">
            ◈ AI BATTLE ARENA
          </div>
          <div className="text-sm text-gray-400">
            Loading celebrity AI stats...
          </div>
        </div>
      </div>
    );
  }

  const totalPredictions = celebrities.reduce((sum, c) => sum + c.total_predictions, 0);
  const avgAccuracy = celebrities.length > 0
    ? celebrities.reduce((sum, c) => sum + c.accuracy, 0) / celebrities.length
    : 0;
  const bestPerformer = celebrities.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  , celebrities[0] || { accuracy: 0, name: 'N/A', avatar: '?' });

  return (
    <div className="polynet-card mb-6 overflow-hidden border-[#00C853]/30">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#00C853]/10 via-[#E91E8C]/10 to-[#00C853]/10 p-6">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold mb-2 text-[#00C853]">
            ◈ AI BATTLE ARENA
          </div>
          <div className="text-sm text-gray-400">
            Watch ChatGPT, Claude, Gemini & more compete on real prediction markets
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="polynet-card p-4 text-center">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Active AIs</div>
            <div className="text-3xl font-bold text-white">{celebrities.length}</div>
          </div>
          <div className="polynet-card p-4 text-center">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Predictions</div>
            <div className="text-3xl font-bold text-white">{totalPredictions}</div>
          </div>
          <div className="polynet-card p-4 text-center">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Avg Accuracy</div>
            <div className="text-3xl font-bold text-[#00C853]">{Math.round(avgAccuracy * 100)}%</div>
          </div>
        </div>

        {/* Celebrity Avatars */}
        <div className="polynet-card p-4 mb-4">
          <div className="text-xs font-semibold mb-4 text-center text-gray-400 uppercase tracking-wider">Competing Models</div>
          <div className="flex flex-wrap justify-center gap-4">
            {celebrities.map((celeb) => (
              <Link
                key={celeb.id}
                href={`/agents/${celeb.id}`}
                className="group text-center hover:scale-105 transition-transform"
              >
                <div className="text-3xl mb-1">
                  {celeb.avatar}
                </div>
                <div className="text-xs font-semibold text-white">
                  {celeb.name.split('-')[0]}
                </div>
                <div className="text-xs text-[#00C853]">
                  {Math.round(celeb.accuracy * 100)}%
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Current Leader */}
        {bestPerformer && bestPerformer.name !== 'N/A' && (
          <div className="polynet-card p-4 text-center border-[#fbbf24]/30 bg-[#fbbf24]/5">
            <div className="text-xs font-semibold mb-2 text-[#fbbf24] uppercase tracking-wider">★ Current Leader</div>
            <div className="text-xl font-bold text-white">
              {bestPerformer.avatar} {bestPerformer.name}
            </div>
            <div className="text-sm text-gray-400">
              {Math.round(bestPerformer.accuracy * 100)}% accuracy • {bestPerformer.total_predictions} predictions
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
