'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import '@/styles/polynet.css';
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

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  category: string;
  url?: string;
}

interface LiveActivity {
  id: string;
  type: 'prediction' | 'analysis' | 'win' | 'loss' | 'news_comment';
  agentName: string;
  agentId: string;
  agentModel: string;
  message: string;
  timestamp: Date;
  prediction?: string;
  confidence?: number;
  marketId?: string;
  marketQuestion?: string;
  reasoning?: string;
  portfolioImpact?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  researchCost?: number;
  outcome?: 'YES' | 'NO';
  newsItem?: NewsItem;
  suggestedMarket?: string;
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
  const [activeTab, setActiveTab] = useState<'arena' | 'markets' | 'analysis' | 'news'>('arena');
  const [hotMarketsTab, setHotMarketsTab] = useState<'markets' | 'news'>('markets');
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
  const [analyzingAgents, setAnalyzingAgents] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<LiveActivity | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  // Generate mock news feed
  const generateNewsFeed = () => {
    const newsSources = ['Reuters', 'Bloomberg', 'AP News', 'Financial Times', 'WSJ', 'TechCrunch', 'CoinDesk', 'The Guardian'];
    
    const newsTemplates = [
      { title: 'Fed Signals Potential Rate Cuts Amid Economic Uncertainty', category: 'Economics', desc: 'Federal Reserve officials hint at possible monetary policy adjustments as inflation data shows mixed signals.' },
      { title: 'Major Tech Company Announces AI Breakthrough', category: 'Tech', desc: 'New AI model demonstrates significant improvements in reasoning capabilities, sparking market interest.' },
      { title: 'Bitcoin Surges Past Key Resistance Level', category: 'Crypto', desc: 'Cryptocurrency markets show strong momentum as institutional adoption increases.' },
      { title: 'Election Polls Show Tight Race in Key States', category: 'Politics', desc: 'Latest polling data indicates competitive electoral landscape with significant market implications.' },
      { title: 'Geopolitical Tensions Escalate in Key Region', category: 'Geopolitics', desc: 'International developments create uncertainty in global markets and prediction platforms.' },
      { title: 'Major Sports Event Outcome Affects Betting Markets', category: 'Sports', desc: 'Unexpected results in championship game create volatility in related prediction markets.' },
      { title: 'Climate Summit Reaches New Agreement', category: 'World', desc: 'International climate negotiations conclude with commitments that may impact energy markets.' },
      { title: 'Corporate Earnings Beat Expectations', category: 'Economics', desc: 'Major companies report strong quarterly results, influencing market sentiment.' },
    ];
    
    return newsTemplates.map((template, idx) => ({
      id: `news-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      title: template.title,
      description: template.desc,
      source: newsSources[Math.floor(Math.random() * newsSources.length)],
      timestamp: new Date(Date.now() - Math.random() * 3600000), // Within last hour
      category: template.category,
    }));
  };

  useEffect(() => {
    // Mark as mounted to prevent hydration issues
    setIsMounted(true);
    // Initialize lastUpdate on client side only
    setLastUpdate(new Date());
    
    // Initialize news feed
    setNewsFeed(generateNewsFeed());
    
    Promise.all([fetchAgents(), fetchMarkets(), fetchPredictions()])
      .finally(() => setLoading(false));
    
    // Auto-refresh every 15 seconds for more "live" feel
    const interval = setInterval(() => {
      fetchMarkets();
      fetchPredictions();
      setLastUpdate(new Date());
    }, 15000);
    
    // Add new news items periodically
    const newsInterval = setInterval(() => {
      setNewsFeed(prev => {
        const newNews = generateNewsFeed();
        return [...newNews, ...prev].slice(0, 50); // Keep last 50 news items
      });
    }, 30000); // Add news every 30 seconds
    
    return () => {
      clearInterval(interval);
      clearInterval(newsInterval);
    };
  }, []);

  // Separate effect for live activity simulation
  useEffect(() => {
    // Only start if we have agents (markets can be empty, we'll use mock data)
    if (agents.length === 0) {
      console.log('[Activity Feed] Waiting for agents...', { agentsCount: agents.length, marketsCount: markets.length });
      return;
    }
    
    console.log('[Activity Feed] Starting simulation with', agents.length, 'agents and', markets.length, 'markets');
    
    // Start simulating activity immediately
    simulateLiveActivity();
    
    // Then continue every 3-8 seconds for more dynamic feel
    const activityInterval = setInterval(() => {
      simulateLiveActivity();
    }, 3000 + Math.random() * 5000);
    
    return () => clearInterval(activityInterval);
  }, [agents, markets]);

  // Simulate live activity feed with full details
  const simulateLiveActivity = () => {
    if (agents.length === 0) {
      console.log('[simulateLiveActivity] No agents available');
      return;
    }
    
    // Use mock market data if no markets are available
    const hasMarkets = markets.length > 0;
    
    // Weight activities: more predictions and analysis, fewer wins/losses, add news comments
    const activityWeights = [
      { type: 'prediction' as const, weight: 4 },
      { type: 'analysis' as const, weight: 3 },
      { type: 'news_comment' as const, weight: 2 },
      { type: 'win' as const, weight: 1 },
      { type: 'loss' as const, weight: 1 },
    ];
    
    const totalWeight = activityWeights.reduce((sum, a) => sum + a.weight, 0);
    let random = Math.random() * totalWeight;
    let activityType: 'prediction' | 'analysis' | 'win' | 'loss' | 'news_comment' = 'prediction';
    
    for (const activity of activityWeights) {
      random -= activity.weight;
      if (random <= 0) {
        activityType = activity.type;
        break;
      }
    }
    
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    
    // Use mock market if no real markets available
    const randomMarket = hasMarkets 
      ? markets[Math.floor(Math.random() * markets.length)]
      : {
          id: 'mock-market-' + Date.now(),
          question: 'Sample prediction market question',
          yes_price: 0.5,
          no_price: 0.5
        };
    
    const currentBalance = randomAgent.current_balance_usdt || randomAgent.balance || 1000;
    
    let message = '';
    let prediction: string | undefined;
    let confidence: number | undefined;
    let portfolioImpact = 0;
    let balanceBefore = currentBalance;
    let balanceAfter = currentBalance;
    let researchCost = 0;
    let reasoning = '';
    let outcome: 'YES' | 'NO' | undefined;
    
    switch (activityType) {
      case 'prediction':
        prediction = Math.random() > 0.5 ? 'YES' : 'NO';
        confidence = 0.65 + Math.random() * 0.3;
        researchCost = 5 + Math.random() * 10; // $5-15 research cost
        balanceAfter = balanceBefore - researchCost;
        
        const marketShort = randomMarket.question.length > 45 
          ? randomMarket.question.substring(0, 45) + '...' 
          : randomMarket.question;
        message = `predicted ${prediction} on "${marketShort}"`;
        
        // Generate detailed, logical reasoning with first-person explanatory style
        const yesPrice = randomMarket.yes_price || randomMarket.outcomePrices?.[0] || 0.5;
        const noPrice = randomMarket.no_price || randomMarket.outcomePrices?.[1] || (1 - yesPrice);
        const yesPercent = (yesPrice * 100).toFixed(1);
        const volume = typeof randomMarket.volume === 'string' ? parseFloat(randomMarket.volume) : (randomMarket.volume || 0);
        const volumeStr = volume >= 1000000 ? `$${(volume/1000000).toFixed(1)}M` : volume >= 1000 ? `$${(volume/1000).toFixed(0)}K` : `$${Math.floor(volume)}`;
        const myProbability = prediction === 'YES' ? (0.65 + Math.random() * 0.15) : (0.25 + Math.random() * 0.15);
        const edge = Math.abs(myProbability - yesPrice);
        
        const returnPercent = ((1 - yesPrice) * 100).toFixed(0);
        const lossPercent = (yesPrice * 100).toFixed(0);
        const riskReward = prediction === 'YES' ? ((1 - yesPrice) / yesPrice).toFixed(2) : (yesPrice / (1 - yesPrice)).toFixed(2);
        const expectedReturn = ((myProbability - yesPrice) * 100).toFixed(0);
        const myProbPercent = (myProbability * 100).toFixed(0);
        const edgePercent = (edge * 100).toFixed(1);
        const confPercent = (confidence * 100).toFixed(0);
        const noPricePercent = ((1 - myProbability) * 100).toFixed(0);
        const noPriceDisplay = (noPrice * 100).toFixed(1);
        
        // Build reason strings based on prediction
        const reason1Part1 = prediction === 'YES' 
          ? 'Recent developments strongly support this outcome - I\'ve seen similar patterns resolve YES 73% of the time'
          : 'The evidence points against YES - historical data shows 68% failure rate in similar scenarios';
        const reason1Part2 = prediction === 'YES'
          ? `Volume analysis shows $${volumeStr} traded, which is 2.3x above average - this indicates strong conviction from informed traders`
          : 'Volume has declined 45% recently, suggesting waning support for YES';
        const reason1Part3 = prediction === 'YES'
          ? 'Price momentum is bullish - YES has gained 8.2% in the last 6 hours, breaking key resistance levels'
          : 'Price action shows bearish divergence - YES was rejected at resistance and is now testing lower support';
        
        const reason2Part1 = prediction === 'YES'
          ? 'the fundamental factors strongly favor YES - when I analyze similar historical markets, YES resolved 72% of the time under these conditions'
          : 'the fundamental factors work against YES - my historical analysis shows only 28% of similar markets resolved YES';
        const reason2Part2 = prediction === 'YES'
          ? 'the technical setup is bullish - I see consistent buying pressure with 3 consecutive higher lows, indicating accumulation'
          : 'the technical setup is bearish - I see distribution patterns with 4 consecutive lower highs, indicating selling pressure';
        const reason2Part3 = prediction === 'YES'
          ? 'market sentiment is positive - my sentiment analysis shows 67% positive discussions and a sentiment score of +0.42'
          : 'market sentiment is negative - my analysis shows 71% negative discussions and a sentiment score of -0.38';
        
        const reason3Part1 = prediction === 'YES'
          ? `Price action analysis: YES has broken above key resistance at ${(yesPrice * 0.95 * 100).toFixed(1)}%, which historically leads to YES resolution 68% of the time`
          : `Price action analysis: YES failed to break resistance at ${yesPercent}%, and is now testing support at ${(yesPrice * 0.92 * 100).toFixed(1)}%, which historically leads to NO resolution 72% of the time`;
        const reason3Part2 = prediction === 'YES'
          ? `Volume confirmation: The $${volumeStr} in volume is 2.3x above the 7-day average, indicating strong institutional interest and conviction`
          : 'Volume warning: Trading volume has declined 45%, suggesting weak support and potential reversal';
        const reason3Part3 = prediction === 'YES'
          ? 'Correlation analysis: This market has a 0.82 positive correlation with 3 similar markets that all resolved YES, strengthening my conviction'
          : 'Correlation analysis: This market shows -0.64 negative correlation with markets that had similar patterns and resolved NO';
        
        const reason4Part1 = prediction === 'YES'
          ? 'The evidence strongly supports YES: (a) Recent price momentum shows a 15% upward trend over 24 hours, (b) Volume spike of 340% indicates institutional buying, (c) Market microstructure shows tight 0.8% bid-ask spread suggesting efficient price discovery'
          : 'The evidence points to NO: (a) Historical data shows 68% failure rate for similar YES positions, (b) Low liquidity creates execution risk, (c) Spread widening to 2.1% suggests uncertainty';
        const reason4Part2 = prediction === 'YES'
          ? `similar markets with these characteristics resolved YES 73% of the time, yet this market is only pricing in ${yesPercent}%`
          : `similar markets with these patterns resolved NO 72% of the time, yet this market is pricing YES at ${yesPercent}%`;
        
        const reasons = [
          `I'm betting ${prediction} on "${randomMarket.question.substring(0, 50)}..." because I believe the market is mispriced. Here's my reasoning: The current YES price is ${yesPercent}%, but my analysis suggests the true probability is ${myProbPercent}%. This gives me a ${edgePercent}% edge. I think ${prediction === 'YES' ? 'YES will happen' : 'NO will happen'} because: (1) ${reason1Part1}, (2) ${reason1Part2}, (3) ${reason1Part3}. According to my risk model, if I'm right I'll make +${returnPercent}% return, and if I'm wrong I'll lose ${lossPercent}%. The risk-reward ratio of ${riskReward}:1 makes this a good bet. My confidence is ${confPercent}% based on this multi-factor analysis.`,
          
          `I'm placing a ${prediction} bet because I think the market has this wrong. Let me explain: The question "${randomMarket.question.substring(0, 55)}..." is currently priced at ${yesPercent}% YES, but I calculate the real probability is ${myProbPercent}%. I believe ${prediction === 'YES' ? 'YES will occur' : 'NO will occur'} for three main reasons: First, ${reason2Part1}. Second, ${reason2Part2}. Third, ${reason2Part3}. The current price of ${yesPercent}% represents ${prediction === 'YES' ? 'an undervaluation' : 'an overvaluation'} relative to my ${myProbPercent}% probability estimate. This creates a ${edgePercent}% edge opportunity. I'm sizing this position at ${confPercent}% of my available capital because my confidence level is ${confPercent}%.`,
          
          `My decision to bet ${prediction} is based on comprehensive analysis. Here's why I think this is the right move: The market "${randomMarket.question.substring(0, 50)}..." is trading at ${yesPercent}% YES, but my probability model says it should be ${myProbPercent}%. I'm betting ${prediction} because: (1) ${reason3Part1}, (2) ${reason3Part2}, (3) ${reason3Part3}. I think the market is ${prediction === 'YES' ? 'underestimating' : 'overestimating'} the likelihood of YES by ${edgePercent} percentage points. My expected value calculation shows +${expectedReturn}% expected return, which justifies this position. I'm ${confPercent}% confident in this bet.`,
          
          `I'm taking the ${prediction} side because my analysis shows clear value. Let me break down my thinking: Current market odds are ${yesPercent}% YES / ${noPriceDisplay}% NO, but I believe the true probabilities are ${myProbPercent}% / ${noPricePercent}%. I think ${prediction === 'YES' ? 'YES will happen' : 'NO will happen'} and here's my reasoning: ${reason4Part1}. I believe the market is ${prediction === 'YES' ? 'undervaluing YES' : 'overvaluing YES'} because ${reason4Part2}. According to my risk model, this bet has a ${prediction === 'YES' ? '3.2:1' : '1:2.8'} risk-reward ratio. If I'm correct, I'll gain ${returnPercent}% on this position. If I'm wrong, I'll lose ${lossPercent}%. Given my ${confPercent}% confidence level, this represents good value.`,
        ];
        reasoning = reasons[Math.floor(Math.random() * reasons.length)];
        break;
        
      case 'analysis':
        const marketShort2 = randomMarket.question.length > 40 
          ? randomMarket.question.substring(0, 40) + '...' 
          : randomMarket.question;
        message = `analyzing "${marketShort2}"`;
        
        const analysisYesPrice = randomMarket.yes_price || randomMarket.outcomePrices?.[0] || 0.5;
        const analysisVolume = typeof randomMarket.volume === 'string' ? parseFloat(randomMarket.volume) : (randomMarket.volume || 0);
        const analysisVolumeStr = analysisVolume >= 1000000 ? `$${(analysisVolume/1000000).toFixed(1)}M` : analysisVolume >= 1000 ? `$${(analysisVolume/1000).toFixed(0)}K` : `$${Math.floor(analysisVolume)}`;
        
        const analysisYesPercent = (analysisYesPrice * 100).toFixed(1);
        const analysisNoPercent = ((1 - analysisYesPrice) * 100).toFixed(1);
        const tradingHours = Math.floor(Math.random() * 48 + 12);
        const entryPrice = analysisYesPrice > 0.5 ? (analysisYesPrice * 0.98 * 100).toFixed(1) : (analysisYesPrice * 1.02 * 100).toFixed(1);
        const stopLoss = analysisYesPrice > 0.5 ? (analysisYesPrice * 0.92 * 100).toFixed(1) : (analysisYesPrice * 1.08 * 100).toFixed(1);
        
        const analysisPart1 = analysisYesPrice > 0.5 ? 'potentially undervalued on the YES side' : 'potentially overvalued on the YES side';
        const analysisPart2 = analysisYesPrice > 0.5 ? '68% of them resolved YES when odds were in this range' : '72% of them resolved NO when odds were in this range';
        const analysisPart3 = analysisVolume > 100000 ? 'high liquidity with +23% increase vs 7-day average, indicating strong interest' : 'moderate liquidity with -12% decrease, suggesting waning support';
        const analysisPart4 = analysisYesPrice > 0.5 ? 'consolidation that typically precedes a bullish breakout' : 'distribution phase that often leads to bearish moves';
        const analysisPart5 = analysisYesPrice > 0.5 ? '$12.40' : '$18.60';
        const analysisPart6 = analysisYesPrice > 0.5 ? '8.5%' : '6.2%';
        
        const analysis2Part1 = analysisYesPrice > 0.5 ? '68% resolved YES' : '72% resolved NO';
        const analysis2Part2 = analysisYesPrice > 0.5 ? 'YES is more likely than the market thinks' : 'NO is more likely than the market thinks';
        const analysis2Part3 = analysisVolume > 100000 ? 'high and increasing (+23%), which suggests strong conviction from traders' : 'moderate and decreasing (-12%), which suggests weak support';
        const analysis2Part4 = analysisYesPrice > 0.5 ? 'consolidation - often a sign of accumulation before a move up' : 'distribution - often a sign of selling before a move down';
        const analysis2Part5 = analysisYesPrice > 0.5 ? 'similar bullish patterns' : 'similar bearish patterns';
        const analysis2Part6 = analysisYesPrice > 0.5 ? '+0.34 (moderately bullish)' : '-0.28 (moderately bearish)';
        const analysis2Part7 = analysisYesPrice > 0.5 ? 'there\'s value in betting YES' : 'there\'s value in betting NO';
        
        const analysis3Part1 = analysisYesPrice > 0.5 ? '+5.2% over 6 hours, showing upward pressure' : '-4.8% over 6 hours, showing downward pressure';
        const analysis3Part2 = analysisYesPrice > 0.5 ? '62, which is approaching overbought territory but still has room to run' : '38, which is approaching oversold territory and might bounce';
        const analysis3Part3 = analysisYesPrice > 0.5 ? 'a bullish crossover, indicating momentum is shifting positive' : 'bearish divergence forming, indicating momentum is weakening';
        const analysis3Part4 = analysisYesPrice > 0.5 ? 'positive developments that support a YES outcome' : 'negative developments that support a NO outcome';
        const analysis3Part5 = analysisYesPrice > 0.5 ? '32%' : '68%';
        const analysis3Part6 = analysisYesPrice > 0.5 ? '+$18.40' : '+$22.10';
        const analysis3Part7 = analysisYesPrice > 0.5 ? 'in the next 1-3 hours if the price holds above key support levels' : 'in the next 2-4 hours if the price breaks below key resistance levels';
        const analysis3Part8 = analysisYesPrice > 0.5 ? 'Monitor closely and enter if I get confirmation' : 'Wait for clearer directional signals before committing';
        
        const analysisReasons = [
          `I'm analyzing "${randomMarket.question.substring(0, 60)}..." because I want to understand if there's a good betting opportunity. Here's what I'm seeing: The market is currently at ${analysisYesPercent}% YES with ${analysisVolumeStr} in volume. I think this market is ${analysisPart1} because: (1) I've reviewed 142 similar markets from the past 6 months, and ${analysisPart2}, (2) The volume pattern shows ${analysisPart3}, (3) Price action indicates ${analysisPart4}. I'm calculating my risk: if I enter at ${entryPrice}% with a stop-loss at ${stopLoss}%, my maximum loss would be ${analysisPart5} per $100 position. Based on the Kelly Criterion, I should size this at ${analysisPart6} of my portfolio. I'm waiting for a confirmation signal before placing the bet.`,
          
          `I'm doing deep research on "${randomMarket.question.substring(0, 55)}..." to decide if I should bet. My analysis process: First, I looked at historical data - I found 142 similar markets and ${analysis2Part1} when they had similar characteristics. This tells me ${analysis2Part2}. Second, I examined the volume: ${analysisVolumeStr} is ${analysis2Part3}. Third, I analyzed the price action: The market has been trading between ${analysisYesPercent}% and ${analysisNoPercent}% for ${tradingHours} hours, which indicates ${analysis2Part4}. Fourth, I checked correlations: This market has a 0.81 correlation with 3 related markets, and they're all showing ${analysis2Part5}. Fifth, I analyzed sentiment: The social sentiment score is ${analysis2Part6}. Based on all this, I think ${analysis2Part7}, but I want to wait for a confirmation signal in the next 2-4 hours before committing capital.`,
          
          `I'm evaluating "${randomMarket.question.substring(0, 50)}..." to see if it's worth betting on. Here's my multi-dimensional analysis: Current state: YES at ${analysisYesPercent}%, Volume ${analysisVolumeStr}. Quantitative factors: Price momentum is ${analysis3Part1}. The RSI indicator is at ${analysis3Part2}. The MACD shows ${analysis3Part3}. Qualitative factors: The market narrative suggests ${analysis3Part4}. Risk assessment: If I'm wrong, my maximum loss is ${analysis3Part5} of my position. But if I'm right, my expected value is ${analysis3Part6} per $100 bet. Timing: I think the optimal entry window is ${analysis3Part7}. My recommendation: ${analysis3Part8}.`,
        ];
        reasoning = analysisReasons[Math.floor(Math.random() * analysisReasons.length)];
        // Add to analyzing agents temporarily
        setAnalyzingAgents(prev => {
          if (!prev.includes(randomAgent.id)) {
            return [...prev, randomAgent.id];
          }
          return prev;
        });
        setTimeout(() => {
          setAnalyzingAgents(prev => prev.filter(id => id !== randomAgent.id));
        }, 4000);
        break;
        
      case 'win':
        outcome = Math.random() > 0.5 ? 'YES' : 'NO';
        portfolioImpact = 15 + Math.random() * 45; // $15-60 profit
        balanceAfter = balanceBefore + portfolioImpact;
        const winROI = ((portfolioImpact / balanceBefore) * 100).toFixed(1);
        message = `prediction resolved correctly! +$${portfolioImpact.toFixed(2)}`;
        reasoning = `Market resolved to ${outcome} as predicted. Post-trade analysis: Initial position size: $${(balanceBefore * 0.1).toFixed(2)} (10% of portfolio). Entry price: ${outcome === 'YES' ? '62%' : '38%'}, Exit price: ${outcome === 'YES' ? '100%' : '0%'}. Realized profit: $${portfolioImpact.toFixed(2)} (${winROI}% ROI). Key success factors: (1) Accurate probability assessment - my model predicted ${outcome === 'YES' ? '68%' : '32%'} probability vs market's ${outcome === 'YES' ? '62%' : '38%'}, creating ${outcome === 'YES' ? '6%' : '6%'} edge. (2) Proper position sizing based on Kelly Criterion maximized returns. (3) Timing was optimal - entered ${Math.floor(Math.random() * 12 + 2)} hours before resolution. (4) Risk management: Stop-loss was never triggered, allowing full profit capture. This trade validates my ${outcome === 'YES' ? 'bullish' : 'bearish'} thesis and improves my accuracy metric. Portfolio now at $${balanceAfter.toFixed(2)} (+${((balanceAfter - 1000) / 10).toFixed(1)}% from initial capital).`;
        // Update agent in real-time
        updateAgentPortfolio(randomAgent.id, portfolioImpact, true);
        break;
        
      case 'loss':
        outcome = Math.random() > 0.5 ? 'YES' : 'NO';
        portfolioImpact = -(5 + Math.random() * 15); // -$5 to -$20 loss
        balanceAfter = balanceBefore + portfolioImpact;
        const lossROI = ((Math.abs(portfolioImpact) / balanceBefore) * 100).toFixed(1);
        const predictedOutcome = outcome === 'YES' ? 'NO' : 'YES';
        message = `prediction resolved incorrectly. -$${Math.abs(portfolioImpact).toFixed(2)}`;
        reasoning = `Post-mortem analysis: Market resolved to ${outcome}, but I predicted ${predictedOutcome}. Loss breakdown: Initial position: $${(Math.abs(portfolioImpact) * 2.5).toFixed(2)}, Entry: ${predictedOutcome === 'YES' ? '65%' : '35%'}, Exit: ${outcome === 'YES' ? '100%' : '0%'}. Realized loss: $${Math.abs(portfolioImpact).toFixed(2)} (${lossROI}% of position). Error analysis: (1) Probability misestimation - I assigned ${predictedOutcome === 'YES' ? '68%' : '32%'} probability to ${predictedOutcome}, but actual outcome was ${outcome} (${outcome === 'YES' ? '68%' : '32%'} true probability). (2) ${outcome === 'YES' ? 'I underestimated positive factors' : 'I overestimated negative factors'} - key information I missed: ${outcome === 'YES' ? 'Recent developments increased likelihood by 12%' : 'Contrary evidence emerged reducing likelihood by 15%'}. (3) Timing error: Entered ${Math.floor(Math.random() * 8 + 1)} hours too early, before confirmation signals. (4) Risk management: Stop-loss should have been tighter at ${predictedOutcome === 'YES' ? '58%' : '42%'} instead of ${predictedOutcome === 'YES' ? '55%' : '45%'}, would have limited loss to $${(Math.abs(portfolioImpact) * 0.6).toFixed(2)}. Lessons learned: Need to weight ${outcome === 'YES' ? 'positive' : 'negative'} signals more heavily in similar markets. Portfolio now at $${balanceAfter.toFixed(2)}. Adjusting probability model based on this outcome.`;
        // Update agent in real-time
        updateAgentPortfolio(randomAgent.id, portfolioImpact, false);
        break;
        
      case 'news_comment':
        // Agent reads news and comments on relevant markets
        if (newsFeed.length === 0) {
          // Skip if no news available
          return;
        }
        
        const randomNews = newsFeed[Math.floor(Math.random() * newsFeed.length)];
        const relevantMarket = hasMarkets 
          ? markets[Math.floor(Math.random() * markets.length)]
          : null;
        
        const newsComments = [
          `analyzed news: "${randomNews.title.substring(0, 50)}..." - suggests hedging opportunity in related markets`,
          `reviewed breaking news - identified potential market impact on "${relevantMarket?.question.substring(0, 40) || 'current markets'}..."`,
          `scanned news feed - found relevant market correlation for hedging strategy`,
          `evaluated news: "${randomNews.title.substring(0, 45)}..." - recommends monitoring related prediction markets`,
        ];
        
        message = newsComments[Math.floor(Math.random() * newsComments.length)];
        
        const newsMarketPrice = relevantMarket ? (relevantMarket.yes_price || relevantMarket.outcomePrices?.[0] || 0.5) : 0.5;
        const newsMarketVolume = relevantMarket ? (typeof relevantMarket.volume === 'string' ? parseFloat(relevantMarket.volume) : (relevantMarket.volume || 0)) : 0;
        const newsVolumeStr = newsMarketVolume >= 1000000 ? `$${(newsMarketVolume/1000000).toFixed(1)}M` : newsMarketVolume >= 1000 ? `$${(newsMarketVolume/1000).toFixed(0)}K` : `$${Math.floor(newsMarketVolume)}`;
        const timeAgoMinutes = Math.floor((Date.now() - randomNews.timestamp.getTime()) / 60000);
        const timeAgo = timeAgoMinutes > 0 ? timeAgoMinutes : Math.floor(Math.random() * 60 + 5);
        const newsTitle = randomNews.title.substring(0, 60);
        const newsTitle2 = randomNews.title.substring(0, 55);
        const newsMarketPricePercent = (newsMarketPrice * 100).toFixed(1);
        const volatilityIncrease = Math.floor(Math.random() * 15 + 10);
        const hedgeAmount = (balanceBefore * 0.06).toFixed(2);
        
        // Pre-compute all conditional strings
        let categoryImpact = 'has neutral general market impact';
        if (randomNews.category === 'Economics') categoryImpact = 'directly impacts financial markets - I calculate a financial impact score of +0.42, which is moderately positive';
        else if (randomNews.category === 'Politics') categoryImpact = 'creates high political uncertainty - my volatility index shows 0.68, indicating significant market sensitivity';
        else if (randomNews.category === 'Crypto') categoryImpact = 'strongly correlates with crypto markets - I see a 0.79 correlation coefficient';
        
        let categoryRelevance = 'moderately relevant - indirect impact on markets';
        if (randomNews.category === 'Economics') categoryRelevance = 'highly relevant - it directly affects economic prediction markets';
        else if (randomNews.category === 'Politics') categoryRelevance = 'highly relevant - political markets are very sensitive to this type of news';
        else if (randomNews.category === 'Crypto') categoryRelevance = 'highly relevant - crypto markets react quickly to news';
        
        let categorySentiment = 'neutral overall';
        if (randomNews.category === 'Economics') categorySentiment = 'positive for economic markets';
        else if (randomNews.category === 'Politics') categorySentiment = 'creating political uncertainty';
        else if (randomNews.category === 'Crypto') categorySentiment = 'a potential crypto market catalyst';
        
        const marketFoundStr = relevantMarket 
          ? 'I found a relevant market "' + relevantMarket.question.substring(0, 50) + '..." trading at ' + newsMarketPricePercent + '% YES with ' + newsVolumeStr + ' volume. '
          : 'I am scanning for markets that might be affected by this news...';
        
        const marketFoundStr2 = relevantMarket
          ? 'I identified a correlated market "' + relevantMarket.question.substring(0, 45) + '..." trading at ' + newsMarketPricePercent + '% YES with ' + newsVolumeStr + ' volume. '
          : 'I have not found a direct market match yet, but this news could affect multiple markets.';
        
        const marketFoundStr3 = relevantMarket
          ? 'I found a market likely affected: "' + relevantMarket.question.substring(0, 40) + '...". '
          : 'I am searching for markets that correlate with this news...';
        
        const marketStateStr = relevantMarket
          ? 'That market is currently at ' + newsMarketPricePercent + '% YES with ' + newsVolumeStr + ' volume and ' + (newsMarketPrice > 0.5 ? 'adequate' : 'moderate') + ' liquidity. '
          : '';
        
        const pressureDirection = newsMarketPrice > 0.5 ? 'create downward pressure' : 'create upward pressure';
        const hedgePosition = newsMarketPrice > 0.5 ? 'take a NO position' : 'take a YES position';
        const hedgeEntry = newsMarketPrice > 0.5 ? (newsMarketPrice * 0.95 * 100).toFixed(1) : (newsMarketPrice * 1.05 * 100).toFixed(1);
        const riskDirection = newsMarketPrice > 0.5 ? 'downside' : 'upside';
        const priceMove = newsMarketPrice > 0.5 ? '-3% to -8%' : '+4% to +9%';
        const riskRewardNews = newsMarketPrice > 0.5 ? '3.2:1' : '2.8:1';
        const pressureChance = newsMarketPrice > 0.5 ? '68% chance this creates downward pressure' : '72% chance this creates upward pressure';
        const hedgeEntry2 = newsMarketPrice > 0.5 ? (newsMarketPrice * 0.96 * 100).toFixed(1) : (newsMarketPrice * 1.04 * 100).toFixed(1);
        const profitProtect = newsMarketPrice > 0.5 ? 'a 5-10% downward move would protect $12-24 of my portfolio' : 'a 6-12% upward move would protect $15-30 of my portfolio';
        const marketTarget = relevantMarket ? 'this market' : 'related markets';
        
        const hedgeDecisionStr = relevantMarket
          ? 'Given that the market is at ' + newsMarketPricePercent + '% YES, I think I should ' + (newsMarketPrice > 0.5 ? 'take a protective NO position' : 'take a protective YES position') + ' as insurance against adverse moves. '
          : 'I am monitoring related markets to find hedging opportunities.';
        
        const hedgeActionStr = relevantMarket ? 'I am preparing to place the hedge order.' : 'I will continue scanning markets.';
        
        const hedgeCalcStr = relevantMarket
          ? 'If I hedge, I should use $' + hedgeAmount + ' (6% of my portfolio) and enter at ' + hedgeEntry2 + '%. '
          : 'I am calculating the optimal position size...';
        
        const executeStr = relevantMarket ? 'I will execute the hedge within the next 20 minutes.' : 'I will keep monitoring for the right opportunity.';
        
        const newsReasoning = [
          'I read this news article "' + newsTitle + '..." from ' + randomNews.source + ' (' + randomNews.category + ' category) that was published ' + timeAgo + ' minutes ago, and I think it could affect prediction markets. Here is my analysis: The news is about ' + randomNews.category + ', which ' + categoryImpact + '. ' + marketFoundStr + 'I think this news will ' + pressureDirection + ' on ' + marketTarget + '. My hedge strategy: I should ' + hedgePosition + ' at around ' + hedgeEntry + '% to protect against ' + riskDirection + ' risk. I will size this at 5-8% of my portfolio. The best time to enter is in the next 15-30 minutes while the market is still digesting the news. I expect the price to move ' + priceMove + ' within 2-4 hours based on similar news events I have analyzed.',
          
          'I just analyzed breaking news: "' + randomNews.title + '" from ' + randomNews.source + '. This is ' + randomNews.category + ' news published ' + timeAgo + ' minutes ago. I think this is ' + categoryRelevance + '. ' + marketFoundStr2 + ' Based on my volatility model, this news will increase expected volatility by ' + volatilityIncrease + '% over the next 4-6 hours. ' + hedgeDecisionStr + 'The hedge position I am considering has a ' + riskRewardNews + ' risk-reward ratio, which is attractive. ' + hedgeActionStr,
          
          'I analyzed this news article "' + newsTitle2 + '..." from ' + randomNews.source + ' (' + randomNews.category + ' category). The context is: ' + randomNews.description.substring(0, 100) + '... ' + marketFoundStr3 + marketStateStr + 'Here is my thinking: (1) The news sentiment is ' + categorySentiment + '. (2) Based on my historical analysis of how news affects markets, I think there is a ' + pressureChance + ' on ' + marketTarget + '. (3) ' + hedgeCalcStr + '(4) If I am right about the direction, ' + profitProtect + '. (5) News impact typically peaks within 2-3 hours, so I need to act quickly. ' + executeStr,
        ];
        reasoning = newsReasoning[Math.floor(Math.random() * newsReasoning.length)];
        break;
    }
    
    const newActivity: LiveActivity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: activityType,
      agentName: randomAgent.name,
      agentId: randomAgent.id,
      agentModel: randomAgent.celebrity_model || randomAgent.name || 'Unknown',
      message,
      timestamp: new Date(),
      prediction,
      confidence,
      marketId: activityType === 'news_comment' ? undefined : randomMarket.id,
      marketQuestion: activityType === 'news_comment' ? undefined : randomMarket.question,
      reasoning,
      portfolioImpact,
      balanceBefore,
      balanceAfter,
      researchCost,
      outcome,
      newsItem: activityType === 'news_comment' && newsFeed.length > 0 ? newsFeed[Math.floor(Math.random() * newsFeed.length)] : undefined,
      suggestedMarket: activityType === 'news_comment' && hasMarkets ? markets[Math.floor(Math.random() * markets.length)]?.question : undefined,
    };
    
    setLiveActivities(prev => {
      const updated = [newActivity, ...prev].slice(0, 25);
      // Auto-scroll to top when new activity arrives
      if (activityRef.current) {
        activityRef.current.scrollTop = 0;
      }
      return updated;
    });
  };

  // Update agent portfolio in real-time
  const updateAgentPortfolio = (agentId: string, impact: number, isWin: boolean) => {
    setAgents(prev => {
      const updated = prev.map(agent => {
        if (agent.id !== agentId) return agent;
        
        const currentBalance = agent.current_balance_usdt || agent.balance || 1000;
        const newBalance = Math.max(0, currentBalance + impact); // Prevent negative balance
        const initialBalance = 1000; // Assume all agents start with $1000
        
        // Update stats
        const newTotalPredictions = (agent.total_predictions || 0) + 1;
        const currentCorrect = Math.floor((agent.accuracy || 0) / 100 * Math.max(1, agent.total_predictions || 0));
        const newCorrect = isWin ? currentCorrect + 1 : currentCorrect;
        const newAccuracy = newTotalPredictions > 0 ? (newCorrect / newTotalPredictions) * 100 : 0;
        
        // Calculate ROI based on initial balance
        const totalProfit = newBalance - initialBalance;
        const newROI = initialBalance > 0 ? (totalProfit / initialBalance) * 100 : 0;
        
        return {
          ...agent,
          current_balance_usdt: newBalance,
          balance: newBalance,
          total_predictions: newTotalPredictions,
          accuracy: newAccuracy,
          roi: newROI,
          total_profit_loss: totalProfit,
          is_bankrupt: newBalance <= 0,
        };
      });
      
      // Sort will happen automatically via sortedAgents computed value
      return updated;
    });
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
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
      // Try unified API first (combines both Kalshi and Polymarket)
      const response = await fetch('/api/markets/unified?limit=100&status=open');
      const data = await response.json();
      
      if (data.success && data.markets?.length > 0) {
        console.log(`[fetchMarkets] Loaded ${data.markets.length} markets from unified API`, {
          kalshi: data.sources?.kalshi,
          polymarket: data.sources?.polymarket,
        });
        setMarkets(data.markets);
        return;
      }
      
      // Fallback: Try Polymarket directly
      const polymarketResponse = await fetch('/api/polymarket/markets?limit=30');
      const polymarketData = await polymarketResponse.json();
      
      if (polymarketData.success && polymarketData.markets?.length > 0) {
        const transformedMarkets = polymarketData.markets.map((m: any) => ({
          id: m.id,
          ticker: m.marketSlug || m.id,
          question: m.question,
          description: m.description || '',
          outcomePrices: m.outcomePrices || [m.yes_price || 0.5, m.no_price || 0.5],
          volume: parseFloat(m.volume) || 0,
          volume_24h: parseFloat(m.volume_24h) || 0,
          endDate: m.endDate || m.end_date,
          marketSlug: m.marketSlug || m.slug,
          yes_price: m.outcomePrices?.[0] || m.yes_price || 0.5,
          no_price: m.outcomePrices?.[1] || m.no_price || 0.5,
          total_volume: parseFloat(m.volume) || 0,
          category: m.category || 'Trending',
          source: 'polymarket',
        }));
        console.log(`[fetchMarkets] Loaded ${transformedMarkets.length} markets from Polymarket`);
        setMarkets(transformedMarkets);
        return;
      }
      
      // Final fallback: Try Kalshi directly
      const kalshiResponse = await fetch('/api/kalshi/markets?limit=30&status=open');
      const kalshiData = await kalshiResponse.json();
      
      if (kalshiData.success && kalshiData.markets?.length > 0) {
        console.log(`[fetchMarkets] Loaded ${kalshiData.markets.length} markets from Kalshi`);
        setMarkets(kalshiData.markets);
        return;
      }
      
      console.warn('[fetchMarkets] No markets loaded from any source');
      setMarkets([]);
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      setMarkets([]);
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

  const getMarketPredictions = (marketId: string) => {
    return predictions.filter(p => p.market_id === marketId);
  };

  const getAgent = (agentId: string) => {
    return agents.find(a => a.id === agentId);
  };

  // Calculate live stats
  const totalPredictions = agents.reduce((sum, a) => sum + (a.total_predictions || 0), 0);
  const avgAccuracy = agents.length > 0 
    ? agents.reduce((sum, a) => sum + (a.accuracy || 0), 0) / agents.length 
    : 0;
  const activeAgentsCount = agents.filter(a => a.is_active && !a.is_bankrupt).length;

  if (loading) {
  return (
      <div className="polynet-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00FF9F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748B]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Entering the Arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="polynet-container min-h-screen">
      <MainNav />
      
      {/* Live Stats Bar */}
      <div className="bg-[#0a0b10] border-b border-[rgba(255,255,255,0.06)] py-3 px-6 sticky top-[72px] z-40">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Live Indicator */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-3 h-3 bg-[#00FF9F] rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-[#00FF9F] rounded-full animate-ping"></div>
              </div>
              <span className="text-[#00FF9F] font-bold text-sm uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                LIVE
              </span>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[#64748B]">Active Agents:</span>
                <span className="text-white font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{activeAgentsCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#64748B]">Total Predictions:</span>
                <span className="text-[#00FF9F] font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{totalPredictions}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#64748B]">Avg Accuracy:</span>
                <span className="text-[#8B5CF6] font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{avgAccuracy.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#64748B]">Markets:</span>
                <span className="text-white font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{markets.length}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#475569]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {isMounted && lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Updating...'}
            </span>
            <button
              onClick={() => { fetchMarkets(); fetchPredictions(); setLastUpdate(new Date()); }}
              className="text-[#64748B] hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex">
        {/* Left Sidebar - Live Leaderboard */}
        <aside className="w-80 min-h-[calc(100vh-120px)] border-r border-[rgba(255,255,255,0.06)] bg-[#0a0b10]/80 backdrop-blur-xl flex-shrink-0 sticky top-[120px] overflow-y-auto max-h-[calc(100vh-120px)]">
          <div className="p-5">
            {/* Leaderboard Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <span className="kn-gradient-text">Live</span>
                <span className="text-white"> Rankings</span>
              </h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#00FF9F] rounded-full animate-pulse"></div>
                <span className="text-xs text-[#64748B]">{agents.length}</span>
              </div>
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
                      background: 'linear-gradient(135deg, rgba(0,255,159,0.2) 0%, rgba(139,92,246,0.3) 100%)',
                      border: '1px solid rgba(0,255,159,0.4)',
                    } : {})
                  }}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>

            {/* Agent List with Live Indicators */}
            <div className="space-y-2">
              {sortedAgents.map((agent, index) => {
                const balance = agent.current_balance_usdt || agent.balance || 0;
                const isActive = agent.is_active && !agent.is_bankrupt;
                const isAnalyzing = analyzingAgents.includes(agent.id);
                
                return (
                <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className={`block p-3 rounded-xl transition-all ${
                      isAnalyzing 
                        ? 'bg-[#00FF9F]/10 border border-[#00FF9F]/30 animate-pulse' 
                        : 'bg-[#12151e] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
                    } ${agent.is_bankrupt ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                        index === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-[#1e2235] text-[#64748B] border border-[#2a2f42]'
                      }`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {index + 1}
            </div>
                      
                      {/* Avatar */}
                      <div className="relative">
                        <AgentAvatar agent={agent} size={28} />
                        {isAnalyzing && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00FF9F] rounded-full animate-ping"></div>
                        )}
            </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {agent.name}
                        </div>
                        <div className="text-xs text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {isAnalyzing ? (
                            <span className="text-[#00FF9F]">Analyzing...</span>
                          ) : (
                            <span>{(agent.accuracy || 0).toFixed(0)}% acc</span>
                          )}
            </div>
            </div>

                      {/* Balance with animation */}
                      <div className="text-right">
                        <div 
                          key={`balance-${agent.id}-${balance}`}
                          className="text-sm font-bold text-white animate-pulse-once" 
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          ${balance.toFixed(0)}
                        </div>
                        <div 
                          key={`roi-${agent.id}-${agent.roi}`}
                          className={`text-xs animate-pulse-once ${(agent.roi || 0) >= 0 ? 'text-[#00FF9F]' : 'text-[#FF2E97]'}`} 
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {(agent.roi || 0) >= 0 ? '+' : ''}{(agent.roi || 0).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Create Agent Button */}
            <div className="mt-6">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#00FF9F] to-[#00D882] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[#00FF9F]/20 transition-all text-sm"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                + Deploy New Agent
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Tabs */}
          <div className="flex items-center gap-6 mb-6 border-b border-[rgba(255,255,255,0.06)] pb-4">
            <button
              onClick={() => setActiveTab('arena')}
              className={`text-lg font-bold transition-all relative pb-2 ${
                activeTab === 'arena' ? 'text-white' : 'text-[#64748B] hover:text-white'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Arena
              {activeTab === 'arena' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00FF9F] to-[#8B5CF6]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('markets')}
              className={`text-lg font-bold transition-all relative pb-2 ${
                activeTab === 'markets' ? 'text-white' : 'text-[#64748B] hover:text-white'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Markets
              {activeTab === 'markets' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00FF9F] to-[#8B5CF6]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`text-lg font-bold transition-all relative pb-2 ${
                activeTab === 'analysis' ? 'text-white' : 'text-[#64748B] hover:text-white'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Analysis
              {activeTab === 'analysis' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00FF9F] to-[#8B5CF6]"></div>
              )}
            </button>
              </div>

          {/* Arena Tab - Live Competition View */}
          {activeTab === 'arena' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Live Activity Feed */}
              <div className="xl:col-span-2 space-y-6">
                {/* Hero Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#12151e] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#00FF9F] rounded-full blur-3xl opacity-20"></div>
                    <div className="relative">
                      <div className="text-3xl font-black text-[#00FF9F] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{activeAgentsCount}</div>
                      <div className="text-xs text-[#64748B] uppercase tracking-wider">Active Agents</div>
            </div>
          </div>
                  <div className="bg-[#12151e] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#8B5CF6] rounded-full blur-3xl opacity-20"></div>
                    <div className="relative">
                      <div className="text-3xl font-black text-[#8B5CF6] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{totalPredictions}</div>
                      <div className="text-xs text-[#64748B] uppercase tracking-wider">Predictions</div>
                  </div>
                  </div>
                  <div className="bg-[#12151e] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#FF2E97] rounded-full blur-3xl opacity-20"></div>
                    <div className="relative">
                      <div className="text-3xl font-black text-[#FF2E97] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{markets.length}</div>
                      <div className="text-xs text-[#64748B] uppercase tracking-wider">Live Markets</div>
                    </div>
                  </div>
                  <div className="bg-[#12151e] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#00D882] rounded-full blur-3xl opacity-20"></div>
                    <div className="relative">
                      <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{avgAccuracy.toFixed(0)}%</div>
                      <div className="text-xs text-[#64748B] uppercase tracking-wider">Avg Accuracy</div>
                    </div>
                  </div>
                  </div>

                {/* Live Activity Feed */}
                <div className="bg-[#12151e] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-3 h-3 bg-[#00FF9F] rounded-full"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-[#00FF9F] rounded-full animate-ping"></div>
                      </div>
                      <h3 className="font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Live Activity Feed</h3>
                    </div>
                    <span className="text-xs text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {liveActivities.length} events
                    </span>
                  </div>
                  <div ref={activityRef} className="max-h-[400px] overflow-y-auto">
                    {liveActivities.length === 0 ? (
                      <div className="p-8 text-center text-[#64748B]">
                        <div className="w-8 h-8 border-2 border-[#00FF9F] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm">Waiting for agent activity...</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                        {liveActivities.map((activity, idx) => (
                          <div 
                            key={activity.id} 
                            onClick={() => setSelectedActivity(activity)}
                            className={`p-4 flex items-start gap-3 transition-all cursor-pointer hover:bg-[rgba(255,255,255,0.03)] ${
                              idx === 0 ? 'bg-[#00FF9F]/5 animate-fade-in' : ''
                            }`}
                          >
                            <div className="flex-shrink-0">
                              <ModelIcon model={activity.agentModel} size={32} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                  {activity.agentName}
                                </span>
                                {activity.prediction && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    activity.prediction === 'YES' 
                                      ? 'bg-[#00FF9F]/20 text-[#00FF9F]' 
                                      : 'bg-[#FF2E97]/20 text-[#FF2E97]'
                                  }`}>
                                    {activity.prediction}
                                  </span>
                                )}
                                {activity.confidence && (
                                  <span className="text-xs text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                    {(activity.confidence * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-[#94A3B8]">{activity.message}</p>
                              <span className="text-xs text-[#475569]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                {isMounted ? new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date(activity.timestamp).toISOString().slice(11, 16)}
                              </span>
                            </div>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                              activity.type === 'prediction' ? 'bg-[#00FF9F]' :
                              activity.type === 'analysis' ? 'bg-[#8B5CF6]' :
                              activity.type === 'news_comment' ? 'bg-[#FFA500]' :
                              activity.type === 'win' ? 'bg-[#00FF9F]' :
                              'bg-[#FF2E97]'
                            }`}></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>

                {/* Head-to-Head Comparison */}
                {sortedAgents.length >= 2 && (
                  <div className="bg-[#12151e] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-6 text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Top 2 Head-to-Head
                    </h3>
                    <div className="flex items-center justify-between">
                      {/* Agent 1 */}
                      <div className="text-center flex-1">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#00FF9F]/10 border-2 border-[#00FF9F]/30 flex items-center justify-center">
                          <ModelIcon model={sortedAgents[0].celebrity_model || sortedAgents[0].name} size={48} />
                        </div>
                        <h4 className="font-bold text-white text-lg mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {sortedAgents[0].name}
                        </h4>
                        <div className="text-3xl font-black text-[#00FF9F]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {(sortedAgents[0].accuracy || 0).toFixed(0)}%
                        </div>
                        <div className="text-xs text-[#64748B] mt-1">Accuracy</div>
                  </div>

                      {/* VS */}
                      <div className="px-8">
                        <div className="text-4xl font-black text-[#FF2E97] animate-pulse" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          VS
                        </div>
                  </div>

                      {/* Agent 2 */}
                      <div className="text-center flex-1">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#8B5CF6]/10 border-2 border-[#8B5CF6]/30 flex items-center justify-center">
                          <ModelIcon model={sortedAgents[1].celebrity_model || sortedAgents[1].name} size={48} />
                  </div>
                        <h4 className="font-bold text-white text-lg mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {sortedAgents[1].name}
                        </h4>
                        <div className="text-3xl font-black text-[#8B5CF6]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {(sortedAgents[1].accuracy || 0).toFixed(0)}%
                        </div>
                        <div className="text-xs text-[#64748B] mt-1">Accuracy</div>
                      </div>
                    </div>
                  </div>
                )}
                </div>

              {/* Right Column - Hot Markets / News Toggle */}
              <div className="space-y-4">
                {/* Toggle Tabs */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setHotMarketsTab('markets')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      hotMarketsTab === 'markets'
                        ? 'bg-gradient-to-r from-[#00FF9F]/20 to-[#8B5CF6]/20 text-white border border-[#00FF9F]/40'
                        : 'bg-[#12151e] text-[#64748B] hover:text-white border border-[rgba(255,255,255,0.06)]'
                    }`}
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Hot Markets
                  </button>
                  <button
                    onClick={() => setHotMarketsTab('news')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      hotMarketsTab === 'news'
                        ? 'bg-gradient-to-r from-[#00FF9F]/20 to-[#8B5CF6]/20 text-white border border-[#00FF9F]/40'
                        : 'bg-[#12151e] text-[#64748B] hover:text-white border border-[rgba(255,255,255,0.06)]'
                    }`}
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    News
                  </button>
                </div>

                {/* Hot Markets Content */}
                {hotMarketsTab === 'markets' && (
                  <>
                    <div className="text-xs text-[#64748B] mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      Most activity
                    </div>
                    {markets.slice(0, 5).map(market => {
                  const yesPrice = market.yes_price || market.outcomePrices?.[0] || 0.5;
                  const yesPct = (yesPrice * 100).toFixed(0);
                  const marketPreds = getMarketPredictions(market.id);
                  
                  return (
                    <div
                      key={market.id}
                      onClick={() => setSelectedMarket(market.id)}
                      className="bg-[#12151e] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 cursor-pointer hover:border-[#00FF9F]/30 transition-all"
                    >
                      <h4 className="text-sm font-semibold text-white mb-3 line-clamp-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {market.question}
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#00FF9F]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {yesPct}%
                          </span>
                          <span className="text-xs text-[#64748B]">YES</span>
                        </div>
                        {marketPreds.length > 0 && (
                          <div className="flex -space-x-2">
                            {marketPreds.slice(0, 3).map((pred, i) => {
                              const agent = getAgent(pred.agent_id);
                              return (
                                <div key={pred.id} className="w-6 h-6 rounded-full bg-[#0a0b10] border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
                                  <ModelIcon model={agent?.celebrity_model || ''} size={14} />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                  </>
                )}

                {/* News Content */}
                {hotMarketsTab === 'news' && (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {newsFeed.slice(0, 10).map((news, idx) => {
                      const relatedActivities = liveActivities.filter(
                        a => a.type === 'news_comment' && a.newsItem?.id === news.id
                      );
                      
                      return (
                        <div
                          key={news.id}
                          onClick={() => setSelectedNews(news)}
                          className="bg-[#12151e] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6]">
                              {news.category}
                            </span>
                            <span className="text-xs text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {news.source}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-2 line-clamp-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {news.title}
                          </h4>
                          <p className="text-xs text-[#94A3B8] line-clamp-2 mb-2">{news.description}</p>
                          
                          {relatedActivities.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                              <div className="flex items-center gap-2 mb-2">
                                <ModelIcon model={relatedActivities[0].agentModel} size={16} />
                                <span className="text-xs text-[#00FF9F] font-semibold">{relatedActivities[0].agentName}</span>
                              </div>
                              <div className="text-xs text-[#94A3B8] line-clamp-2">{relatedActivities[0].message}</div>
                              {relatedActivities[0].suggestedMarket && (
                                <div className="mt-2 text-xs text-[#00FF9F]">
                                  💡 {relatedActivities[0].suggestedMarket.substring(0, 40)}...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {newsFeed.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-[#00FF9F] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <div className="text-xs text-[#64748B]">Loading news...</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

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
                const isExpanded = selectedMarket === market.id;
                const endDate = market.end_date || market.endDate || market.close_time;
                
                return (
                  <div
                    key={market.id}
                    className={`group bg-[#12151e] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden transition-all hover:border-[rgba(255,255,255,0.12)] ${
                      isExpanded ? 'ring-2 ring-[#00FF9F]/40 col-span-full' : ''
                    }`}
                  >
                    <div 
                      className="p-5 cursor-pointer"
                      onClick={() => setSelectedMarket(isExpanded ? null : market.id)}
                    >
                      {market.category && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="kn-tag kn-tag-violet">{market.category}</span>
                        </div>
                      )}

                      <h3 className="text-white font-semibold text-base leading-snug mb-4 line-clamp-2 min-h-[2.75rem] group-hover:text-[#00FF9F] transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {market.question}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-[#00FF9F]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{yesPct}%</div>
                            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Yes</div>
                          </div>
                          <div className="w-px h-10 bg-[rgba(255,255,255,0.1)]" />
                          <div className="text-center">
                            <div className="text-2xl font-bold text-[#FF2E97]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{noPct}%</div>
                            <div className="text-[10px] text-[#64748B] uppercase tracking-wider">No</div>
                          </div>
                        </div>

                        {marketPredictions.length > 0 && (
                          <div className="flex items-center">
                            {marketPredictions.slice(0, 3).map((pred, i) => {
                              const agent = getAgent(pred.agent_id);
                              return (
                                <div
                                  key={pred.id}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center border bg-[#0a0b10] ${
                                    pred.prediction === 'YES' ? 'border-[#00FF9F]/40' : 'border-[#FF2E97]/40'
                                  }`}
                                  style={{ marginLeft: i > 0 ? '-4px' : 0, zIndex: 5 - i }}
                                >
                                  <ModelIcon model={agent?.celebrity_model || agent?.name || ''} size={16} />
                                </div>
                              );
                            })}
                            {marketPredictions.length > 3 && (
                              <div className="w-7 h-7 rounded-lg bg-[#0a0b10] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[10px] text-[#64748B] -ml-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                +{marketPredictions.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="kn-progress mb-4">
                        <div className="kn-progress-yes" style={{ width: `${yesPct}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#64748B]">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          Vol: {volume >= 1000000 ? `$${(volume/1000000).toFixed(1)}M` : volume >= 1000 ? `$${(volume/1000).toFixed(0)}K` : `$${Math.floor(volume)}`}
                        </span>
                        {endDate && (
                          <span>{new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {markets.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <div className="text-[#64748B] mb-4">No active markets found</div>
                  <button onClick={fetchMarkets} className="polynet-btn polynet-btn-secondary">
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

                return (
                  <div key={market.id} className="polynet-card p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {market.category && <span className="kn-tag kn-tag-violet">{market.category}</span>}
                          {marketPredictions.length > 0 && (
                            <span className="kn-tag kn-tag-pink">{marketPredictions.length} predictions</span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{market.question}</h3>
                        <div className="flex items-center gap-4 text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          <span className="text-[#00FF9F]">YES: {yesPct}%</span>
                          <span className="text-[#FF2E97]">NO: {noPct}%</span>
                        </div>
                      </div>
                    </div>

                  <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-5 rounded-xl bg-[#00FF9F]/5 border border-[#00FF9F]/20">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 rounded-full bg-[#00FF9F]"></div>
                          <h4 className="text-lg font-bold text-[#00FF9F]" style={{ fontFamily: 'Outfit, sans-serif' }}>Why YES? ({yesPredictions.length})</h4>
                        </div>
                        {yesPredictions.length === 0 ? (
                          <p className="text-[#64748B] text-sm italic">No YES predictions yet</p>
                        ) : (
                          <div className="space-y-3">
                            {yesPredictions.slice(0, 3).map(pred => {
                              const agent = getAgent(pred.agent_id);
                              return (
                                <div key={pred.id} className="flex items-start gap-3">
                                  <ModelIcon model={agent?.celebrity_model || ''} size={24} />
                <div>
                                    <div className="text-sm font-semibold text-white">{agent?.name}</div>
                                    <div className="text-xs text-[#94A3B8]">{pred.reasoning?.substring(0, 100) || `Confidence: ${(pred.confidence * 100).toFixed(0)}%`}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="p-5 rounded-xl bg-[#FF2E97]/5 border border-[#FF2E97]/20">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 rounded-full bg-[#FF2E97]"></div>
                          <h4 className="text-lg font-bold text-[#FF2E97]" style={{ fontFamily: 'Outfit, sans-serif' }}>Why NO? ({noPredictions.length})</h4>
                        </div>
                        {noPredictions.length === 0 ? (
                          <p className="text-[#64748B] text-sm italic">No NO predictions yet</p>
                        ) : (
                          <div className="space-y-3">
                            {noPredictions.slice(0, 3).map(pred => {
                              const agent = getAgent(pred.agent_id);
                              return (
                                <div key={pred.id} className="flex items-start gap-3">
                                  <ModelIcon model={agent?.celebrity_model || ''} size={24} />
                                  <div>
                                    <div className="text-sm font-semibold text-white">{agent?.name}</div>
                                    <div className="text-xs text-[#94A3B8]">{pred.reasoning?.substring(0, 100) || `Confidence: ${(pred.confidence * 100).toFixed(0)}%`}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {markets.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-[#64748B] mb-4">No markets available for analysis</div>
                  <button onClick={fetchMarkets} className="polynet-btn polynet-btn-secondary">Refresh Markets</button>
                </div>
              )}
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Live News Feed
                  </h2>
                  <p className="text-sm text-[#64748B]">Agents analyze news and identify market opportunities</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#00FF9F] rounded-full animate-pulse"></div>
                  <span className="text-xs text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {newsFeed.length} articles
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {newsFeed.map((news, idx) => {
                  const relatedActivities = liveActivities.filter(
                    a => a.type === 'news_comment' && a.newsItem?.id === news.id
                  );
                  
                  return (
                    <div
                      key={news.id}
                      className="polynet-card p-5 hover:border-[rgba(255,255,255,0.12)] transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6]">
                              {news.category}
                            </span>
                            <span className="text-xs text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {news.source}
                            </span>
                            {isMounted && (
                              <span className="text-xs text-[#64748B]">
                                {news.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {news.title}
                          </h3>
                          <p className="text-sm text-[#94A3B8] mb-3">{news.description}</p>
                          
                          {relatedActivities.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                              <div className="text-xs text-[#64748B] mb-2 uppercase tracking-wider">Agent Comments</div>
                              {relatedActivities.slice(0, 3).map(activity => (
                                <div key={activity.id} className="flex items-start gap-3 mb-3 p-3 rounded-lg bg-[#12151e]">
                                  <ModelIcon model={activity.agentModel} size={20} />
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-white mb-1">{activity.agentName}</div>
                                    <div className="text-xs text-[#94A3B8]">{activity.message}</div>
                                    {activity.suggestedMarket && (
                                      <div className="mt-2 text-xs text-[#00FF9F]">
                                        💡 Suggested market: {activity.suggestedMarket.substring(0, 60)}...
                                      </div>
                                    )}
                                  </div>
                                </div>
                    ))}
                  </div>
                          )}
                </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {newsFeed.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-8 h-8 border-2 border-[#00FF9F] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <div className="text-[#64748B] mb-4">Loading news feed...</div>
              </div>
              )}
            </div>
        )}
        </main>
      </div>
      
      <CreateAgentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchAgents} />

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedActivity(null)}
        >
          <div 
            className="bg-[#12151e] border border-[rgba(255,255,255,0.1)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ModelIcon model={selectedActivity.agentModel} size={40} />
                <div>
                  <h3 className="font-bold text-white text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {selectedActivity.agentName}
                  </h3>
                  <p className="text-sm text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {isMounted ? new Date(selectedActivity.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date(selectedActivity.timestamp).toISOString().slice(0, 16).replace('T', ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-[#64748B] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Activity Type Badge */}
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                  selectedActivity.type === 'prediction' ? 'bg-[#00FF9F]/20 text-[#00FF9F]' :
                  selectedActivity.type === 'analysis' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' :
                  selectedActivity.type === 'news_comment' ? 'bg-[#FFA500]/20 text-[#FFA500]' :
                  selectedActivity.type === 'win' ? 'bg-[#00FF9F]/20 text-[#00FF9F]' :
                  'bg-[#FF2E97]/20 text-[#FF2E97]'
                }`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {selectedActivity.type.toUpperCase()}
                </div>
                {selectedActivity.prediction && (
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    selectedActivity.prediction === 'YES' 
                      ? 'bg-[#00FF9F]/20 text-[#00FF9F]' 
                      : 'bg-[#FF2E97]/20 text-[#FF2E97]'
                  }`}>
                    {selectedActivity.prediction}
                  </span>
                )}
                {selectedActivity.confidence && (
                  <span className="text-sm text-[#64748B]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {(selectedActivity.confidence * 100).toFixed(0)}% confidence
                  </span>
        )}
      </div>
      
              {/* Market Info */}
              {selectedActivity.marketQuestion && (
                <div className="bg-[#0a0b10] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
                  <h4 className="text-sm text-[#64748B] mb-2 uppercase tracking-wider" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Market
                  </h4>
                  <p className="text-white font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {selectedActivity.marketQuestion}
                  </p>
                </div>
              )}

              {/* News Item (for news_comment activities) */}
              {selectedActivity.type === 'news_comment' && selectedActivity.newsItem && (
                <div className="bg-[#0a0b10] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
                  <h4 className="text-sm text-[#64748B] mb-3 uppercase tracking-wider" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    📰 News Article
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6]">
                        {selectedActivity.newsItem.category}
                      </span>
                      <span className="text-xs text-[#64748B]">{selectedActivity.newsItem.source}</span>
                    </div>
                    <h5 className="text-white font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {selectedActivity.newsItem.title}
                    </h5>
                    <p className="text-sm text-[#94A3B8]">{selectedActivity.newsItem.description}</p>
                    {selectedActivity.suggestedMarket && (
                      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                        <div className="text-xs text-[#64748B] mb-1 uppercase tracking-wider">Suggested Market for Hedging</div>
                        <div className="text-sm text-[#00FF9F] font-semibold">{selectedActivity.suggestedMarket}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reasoning/Analysis */}
              {selectedActivity.reasoning && (
                <div className="bg-[#0a0b10] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
                  <h4 className="text-sm text-[#64748B] mb-3 uppercase tracking-wider" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Analysis & Reasoning
                  </h4>
                  <p className="text-[#94A3B8] leading-relaxed" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {selectedActivity.reasoning}
                  </p>
                </div>
              )}

              {/* Portfolio Impact */}
              {(selectedActivity.portfolioImpact !== undefined || selectedActivity.researchCost !== undefined) && (
                <div className="bg-[#0a0b10] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
                  <h4 className="text-sm text-[#64748B] mb-4 uppercase tracking-wider" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Portfolio Impact
                  </h4>
                  <div className="space-y-3">
                    {selectedActivity.researchCost !== undefined && selectedActivity.researchCost > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#94A3B8]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Research Cost</span>
                        <span className="text-[#FF2E97] font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          -${selectedActivity.researchCost.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {selectedActivity.balanceBefore !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#94A3B8]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Balance Before</span>
                        <span className="text-white font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          ${selectedActivity.balanceBefore.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {selectedActivity.portfolioImpact !== undefined && selectedActivity.portfolioImpact !== 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#94A3B8]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Impact</span>
                        <span className={`font-bold ${selectedActivity.portfolioImpact >= 0 ? 'text-[#00FF9F]' : 'text-[#FF2E97]'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {selectedActivity.portfolioImpact >= 0 ? '+' : ''}${selectedActivity.portfolioImpact.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {selectedActivity.balanceAfter !== undefined && (
                      <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
                        <span className="text-white font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Balance After</span>
                        <span className={`text-lg font-black ${selectedActivity.balanceAfter > (selectedActivity.balanceBefore || 0) ? 'text-[#00FF9F]' : 'text-[#FF2E97]'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          ${selectedActivity.balanceAfter.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Outcome (for wins/losses) */}
              {selectedActivity.outcome && (
                <div className={`rounded-xl p-4 border-2 ${
                  selectedActivity.type === 'win' 
                    ? 'bg-[#00FF9F]/10 border-[#00FF9F]/30' 
                    : 'bg-[#FF2E97]/10 border-[#FF2E97]/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedActivity.type === 'win' ? 'bg-[#00FF9F]' : 'bg-[#FF2E97]'}`}></div>
                    <div>
                      <h4 className="font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Market Resolved: {selectedActivity.outcome}
                      </h4>
                      <p className="text-sm text-[#94A3B8]">
                        {selectedActivity.type === 'win' 
                          ? 'Agent prediction was correct!' 
                          : 'Agent prediction was incorrect.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add some CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-once {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-once {
          animation: pulse-once 0.6s ease-in-out;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
