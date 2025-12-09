'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '@/styles/polynet.css';
import { MainNav } from '@/components/navigation/MainNav';

interface Prediction {
  id: string;
  prediction: string;
  confidence: number;
  reasoning: string;
  price_at_prediction: number;
  research_cost: number;
  outcome: string | null;
  correct: boolean | null;
  profit_loss: number | null;
  created_at: string;
  resolved_at: string | null;
  agents: {
    id: string;
    name: string;
    strategy_type: string;
    generation: number;
  };
  polymarket_markets: {
    id: string;
    question: string;
    market_slug: string;
    end_date: string;
    yes_price: number;
    no_price: number;
    resolved: boolean;
    outcome: string | null;
  };
}

interface Stats {
  total: number;
  resolved: number;
  unresolved: number;
  correct: number;
  incorrect: number;
  accuracy: string;
  yesPredictions: number;
  noPredictions: number;
  totalResearchCost: string;
  totalProfitLoss: string;
  avgConfidence: string;
  currentStreak: number;
  longestStreak: number;
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    agentId: '',
    prediction: '',
    resolved: '',
    correct: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  
  useEffect(() => {
    fetchAgents();
  }, []);
  
  useEffect(() => {
    fetchPredictions();
    fetchStats();
  }, [filters]);
  
  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents?all=true');
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };
  
  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.agentId) params.append('agentId', filters.agentId);
      if (filters.prediction) params.append('prediction', filters.prediction);
      if (filters.resolved) params.append('resolved', filters.resolved);
      if (filters.correct) params.append('correct', filters.correct);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      
      const response = await fetch(`/api/predictions/list?${params}`);
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
  
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.agentId) params.append('agentId', filters.agentId);
      
      const response = await fetch(`/api/predictions/stats?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const clearFilters = () => {
    setFilters({
      agentId: '',
      prediction: '',
      resolved: '',
      correct: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };
  
  return (
    <div className="polynet-container min-h-screen">
      <MainNav />
      
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Predictions</h1>
          <p className="text-gray-500">All agent predictions across markets</p>
        </div>
        
        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="polynet-stats-card">
              <div className="polynet-stats-card-value">{stats.total}</div>
              <div className="polynet-stats-card-label">Total Predictions</div>
            </div>
            
            <div className="polynet-stats-card">
              <div className="polynet-stats-card-value text-[#00C853]">{stats.accuracy}%</div>
              <div className="polynet-stats-card-label">Accuracy ({stats.correct}/{stats.resolved})</div>
            </div>
            
            <div className="polynet-stats-card">
              <div className={`polynet-stats-card-value ${parseFloat(stats.totalProfitLoss) >= 0 ? 'text-[#00C853]' : 'text-red-500'}`}>
                {parseFloat(stats.totalProfitLoss) >= 0 ? '+' : ''}${stats.totalProfitLoss}
              </div>
              <div className="polynet-stats-card-label">Profit/Loss</div>
            </div>
            
            <div className="polynet-stats-card">
              <div className="polynet-stats-card-value">{stats.currentStreak}</div>
              <div className="polynet-stats-card-label">Win Streak (Best: {stats.longestStreak})</div>
            </div>
            
            <div className="polynet-stats-card">
              <div className="polynet-stats-card-value">${stats.totalResearchCost}</div>
              <div className="polynet-stats-card-label">Research Cost</div>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="polynet-card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button onClick={clearFilters} className="text-sm text-[#00C853] hover:underline">
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
              <select
                value={filters.agentId}
                onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
                className="polynet-select"
              >
                <option value="">All Agents</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prediction</label>
              <select
                value={filters.prediction}
                onChange={(e) => setFilters({ ...filters, prediction: e.target.value })}
                className="polynet-select"
              >
                <option value="">Yes & No</option>
                <option value="YES">Yes Only</option>
                <option value="NO">No Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.resolved}
                onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
                className="polynet-select"
              >
                <option value="">All</option>
                <option value="true">Resolved</option>
                <option value="false">Pending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Outcome</label>
              <select
                value={filters.correct}
                onChange={(e) => setFilters({ ...filters, correct: e.target.value })}
                className="polynet-select"
              >
                <option value="">All</option>
                <option value="true">Correct</option>
                <option value="false">Incorrect</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="polynet-select"
              >
                <option value="created_at">Date</option>
                <option value="confidence">Confidence</option>
                <option value="profit_loss">Profit/Loss</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Predictions List */}
        <div className="polynet-card overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <span className="font-semibold text-gray-900">Predictions ({predictions.length})</span>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading predictions...</p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="polynet-empty-icon">📊</div>
              <h3 className="polynet-empty-title">No predictions found</h3>
              <p className="polynet-empty-description">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {predictions.map(pred => (
                <button
                  key={pred.id}
                  onClick={() => setSelectedPrediction(pred)}
                  className="w-full p-4 hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-4">
                      <div className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {pred.polymarket_markets?.question || 'Market question unavailable'}
                      </div>
                      <div className="text-sm text-gray-500">
                        By {pred.agents?.name || 'Unknown'} • {pred.agents?.strategy_type?.replace(/_/g, ' ') || 'Unknown'}
                        {pred.agents?.generation > 0 && ` • Gen ${pred.agents.generation}`}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="polynet-yes-no">
                        <span className={`polynet-yes-btn ${pred.prediction === 'YES' ? '!bg-[#00C853] !text-white' : ''}`}>
                          Yes
                        </span>
                        <span className={`polynet-no-btn ${pred.prediction === 'NO' ? '!bg-[#E91E8C] !text-white' : ''}`}>
                          No
                        </span>
                      </div>
                      
                      {pred.outcome && (
                        <span className={`polynet-badge ${pred.correct ? 'polynet-badge-success' : 'polynet-badge-error'}`}>
                          {pred.correct ? '✓ Correct' : '✗ Wrong'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex gap-4 text-gray-500">
                      <span>Confidence: <span className="font-medium text-gray-900">{(pred.confidence * 100).toFixed(0)}%</span></span>
                      <span>Cost: <span className="font-medium text-gray-900">${pred.research_cost?.toFixed(2) || '0.00'}</span></span>
                      {pred.profit_loss !== null && (
                        <span>
                          P/L: <span className={`font-medium ${pred.profit_loss >= 0 ? 'text-[#00C853]' : 'text-red-500'}`}>
                            {pred.profit_loss >= 0 ? '+' : ''}${pred.profit_loss.toFixed(2)}
                          </span>
                        </span>
                      )}
                    </div>
                    
                    <span className="text-gray-400">
                      {new Date(pred.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Prediction Detail Modal */}
        {selectedPrediction && (
          <PredictionDetailModal
            prediction={selectedPrediction}
            onClose={() => setSelectedPrediction(null)}
          />
        )}
      </main>
    </div>
  );
}

function PredictionDetailModal({ prediction, onClose }: { prediction: Prediction; onClose: () => void; }) {
  return (
    <div className="polynet-modal-overlay" onClick={onClose}>
      <div className="polynet-modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="polynet-modal-header">
          <h2 className="polynet-modal-title">Prediction Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        <div className="polynet-modal-body space-y-6">
          {/* Market Question */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Market</div>
            <div className="text-lg font-semibold text-gray-900 mb-2">
              {prediction.polymarket_markets?.question || 'Market question unavailable'}
            </div>
            {prediction.polymarket_markets?.market_slug && (
              <a 
                href={`https://polymarket.com/event/${prediction.polymarket_markets.market_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#00C853] hover:underline"
              >
                View on Polymarket →
              </a>
            )}
          </div>
          
          {/* Agent Info */}
          <div className="polynet-card p-4">
            <div className="text-sm text-gray-500 mb-1">Agent</div>
            <div className="font-semibold text-gray-900">{prediction.agents?.name || 'Unknown'}</div>
            <div className="text-sm text-gray-500">
              {prediction.agents?.strategy_type?.replace(/_/g, ' ') || 'Unknown'}
              {prediction.agents?.generation > 0 && ` • Generation ${prediction.agents.generation}`}
            </div>
          </div>
          
          {/* Prediction & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="polynet-card p-4 text-center">
              <div className="text-sm text-gray-500 mb-2">Prediction</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">{prediction.prediction}</div>
              <div className="text-sm text-gray-500">Confidence: {(prediction.confidence * 100).toFixed(1)}%</div>
            </div>
            
            <div className="polynet-card p-4 text-center">
              <div className="text-sm text-gray-500 mb-2">Market Price</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {((prediction.price_at_prediction || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">When predicted</div>
            </div>
          </div>
          
          {/* Reasoning */}
          <div className="polynet-card p-4">
            <div className="text-sm text-gray-500 mb-2">Reasoning</div>
            <div className="text-sm text-gray-700 leading-relaxed">
              {prediction.reasoning || 'No reasoning provided'}
            </div>
          </div>
          
          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="polynet-card p-4 text-center">
              <div className="text-sm text-gray-500 mb-1">Research Cost</div>
              <div className="text-2xl font-bold text-gray-900">
                ${prediction.research_cost?.toFixed(2) || '0.00'}
              </div>
            </div>
            
            {prediction.profit_loss !== null && (
              <div className="polynet-card p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Profit/Loss</div>
                <div className={`text-2xl font-bold ${prediction.profit_loss >= 0 ? 'text-[#00C853]' : 'text-red-500'}`}>
                  {prediction.profit_loss >= 0 ? '+' : ''}${prediction.profit_loss.toFixed(2)}
                </div>
              </div>
            )}
          </div>
          
          {/* Outcome */}
          {prediction.outcome ? (
            <div className={`polynet-card p-4 ${prediction.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-sm text-gray-500 mb-2">Outcome</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-bold text-gray-900">{prediction.outcome}</div>
                  <div className={`text-sm ${prediction.correct ? 'text-[#00C853]' : 'text-red-500'}`}>
                    {prediction.correct ? '✓ Agent was correct' : '✗ Agent was incorrect'}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Resolved: {new Date(prediction.resolved_at!).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="polynet-card p-4 bg-yellow-50 border-yellow-200">
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <div className="font-semibold text-gray-900">Pending Resolution</div>
              <div className="text-sm text-gray-500">
                Market ends: {new Date(prediction.polymarket_markets?.end_date || '').toLocaleDateString()}
              </div>
            </div>
          )}
          
          {/* Timestamps */}
          <div className="text-sm text-gray-400 border-t border-gray-100 pt-4">
            <div>Predicted: {new Date(prediction.created_at).toLocaleString()}</div>
            {prediction.resolved_at && (
              <div>Resolved: {new Date(prediction.resolved_at).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
