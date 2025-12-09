import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Supabase removed - agent analysis disabled

interface Market {
  id: string;
  question: string;
  description: string;
  market_slug: string;
  yes_price: number;
  no_price: number;
  volume: number;
  end_date: string;
}

interface Agent {
  id: string;
  name: string;
  strategy_type: string;
  balance: number;
  spent: number;
  total_predictions: number;
  is_celebrity: boolean;
  celebrity_model: string;
  traits: {
    systemPrompt: string;
    avatar: string;
    color: string;
  };
}

interface AnalysisResult {
  prediction: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
}

export async function runAgentAnalysisCycle() {
  console.log('⚠️  Agent analysis cycle disabled - Supabase removed');
  return { success: false, message: 'Database not configured. Supabase has been removed.' };
}

async function getTrendingMarkets(): Promise<Market[]> {
  // Supabase removed
  return [];
}

async function getRecentPredictionCount(agentId: string): Promise<number> {
  // Supabase removed
  return 0;
}

function selectMarketsForAgent(markets: Market[], agent: Agent, count: number): Market[] {
  // Shuffle and pick random markets
  const shuffled = [...markets].sort(() => Math.random() - 0.5);
  
  // Filter based on agent strategy preferences
  let filtered = shuffled;
  
  // Conservative agents prefer high-volume markets
  if (agent.strategy_type === 'CONSERVATIVE') {
    filtered = shuffled.filter(m => m.volume > 10000);
  }
  
  // Speed demon prefers any market
  if (agent.strategy_type === 'SPEED_DEMON') {
    filtered = shuffled; // No filter
  }
  
  // Contrarian prefers markets with strong consensus (to bet against)
  if (agent.strategy_type === 'CONTRARIAN') {
    filtered = shuffled.filter(m => m.yes_price > 0.7 || m.yes_price < 0.3);
  }
  
  return filtered.slice(0, count);
}

async function hasAlreadyPredicted(agentId: string, marketId: string): Promise<boolean> {
  // Supabase removed
  return false;
}

async function analyzeMarketWithAgent(
  agent: Agent,
  market: Market
): Promise<AnalysisResult | null> {
  try {
    // 1. Buy research (deduct from balance)
    const researchCost = 0.05; // $0.05 per analysis
    
    if (agent.balance < researchCost) {
      console.log(`💸 ${agent.name} insufficient balance ($${agent.balance.toFixed(2)})`);
      // Supabase removed - cannot mark as bankrupt
      return null;
    }
    
    // Supabase removed - cannot deduct balance or log transactions
    
    console.log(`💰 ${agent.name} spent $${researchCost.toFixed(2)} on research. New balance: $${newBalance.toFixed(2)}`);
    
    // 2. Get AI analysis using Claude
    const systemPrompt = agent.traits?.systemPrompt || 'You are an AI analyzing prediction markets.';
    
    const prompt = `Market Question: "${market.question}"

Market Details:
- Current YES price: ${(market.yes_price * 100).toFixed(1)}%
- Current NO price: ${(market.no_price * 100).toFixed(1)}%
- Trading volume: $${market.volume.toLocaleString()}
- Market closes: ${new Date(market.end_date).toLocaleDateString()}
- Description: ${market.description || 'No additional context'}

Based on your analysis approach, predict whether this market will resolve to YES or NO.

Respond in this EXACT JSON format:
{
  "prediction": "YES" or "NO",
  "confidence": 0.0 to 1.0,
  "reasoning": "2-3 sentence explanation of your decision"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Failed to parse AI response');
      return null;
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validate response
    if (!analysis.prediction || !['YES', 'NO'].includes(analysis.prediction)) {
      console.error('❌ Invalid prediction value');
      return null;
    }
    
    if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) {
      console.error('❌ Invalid confidence value');
      return null;
    }
    
    // 3. Check confidence threshold (default 0.65)
    const confidenceThreshold = 0.65;
    
    if (analysis.confidence < confidenceThreshold) {
      console.log(`🤔 ${agent.name} confidence too low (${(analysis.confidence * 100).toFixed(0)}% < ${(confidenceThreshold * 100).toFixed(0)}%), skipping prediction`);
      return null;
    }
    
    // Supabase removed - cannot store predictions or update stats
    
    return analysis;
    
  } catch (error: any) {
    console.error(`❌ Error analyzing with ${agent.name}:`, error.message);
    return null;
  }
}

