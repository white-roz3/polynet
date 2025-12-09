// Supabase removed - market resolution disabled

export async function runMarketResolutionCycle() {
  console.log('⚠️  Market resolution cycle disabled - Supabase removed');
  return { success: true, resolved: 0 };
}

function mapPolymarketOutcome(outcome: string): 'YES' | 'NO' {
  // Polymarket can have various outcome formats
  const outcomeUpper = outcome.toUpperCase();
  
  if (outcomeUpper.includes('YES') || outcomeUpper === '1' || outcomeUpper === 'TRUE') {
    return 'YES';
  }
  
  return 'NO';
}

async function updatePredictionResults(marketId: string, outcome: 'YES' | 'NO') {
  // Supabase removed
}

async function updateAgentStats(agentId: string) {
  // Supabase removed
}

