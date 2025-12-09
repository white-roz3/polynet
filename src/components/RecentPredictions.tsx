'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Prediction {
  id: string;
  prediction: string;
  confidence: number;
  created_at: string;
  agents: {
    name: string;
  };
  polymarket_markets: {
    question: string;
  };
}

export default function RecentPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/predictions/list?limit=5&sortBy=created_at&sortOrder=desc');
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
  
  return (
    <div className="polynet-card p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-white font-semibold text-base">
          ▶ RECENT PREDICTIONS
        </div>
        <Link 
          href="/predictions"
          className="text-xs text-[#00C853] hover:text-[#00E676] font-semibold transition-colors"
        >
          VIEW ALL →
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center text-gray-500 py-8 text-xs">
          Loading<span className="animate-pulse">...</span>
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center text-gray-500 py-8 text-xs">
          No predictions yet
        </div>
      ) : (
        <div className="space-y-2">
          {predictions.map(pred => (
            <div key={pred.id} className="polynet-card p-3 hover:bg-[#1e2235] transition-colors">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="text-sm font-semibold leading-tight flex-1 text-white">
                  {pred.polymarket_markets?.question?.slice(0, 60) || 'Unknown market'}...
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap ${
                  pred.prediction === 'YES' 
                    ? 'bg-[#00C853]/10 text-[#00C853] border border-[#00C853]/30' 
                    : 'bg-[#E91E8C]/10 text-[#E91E8C] border border-[#E91E8C]/30'
                }`}>
                  {pred.prediction}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <span className="text-gray-400">{pred.agents?.name || 'Unknown'}</span>
                <span className="mx-2">•</span>
                <span className="text-[#00C853]">{(pred.confidence * 100).toFixed(0)}% confident</span>
                <span className="text-gray-600 ml-2">
                  {new Date(pred.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
