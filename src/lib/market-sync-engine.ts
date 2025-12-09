import { fetchPolymarketMarkets, parsePolymarketMarket } from './polymarket-client';

// Supabase removed - market sync disabled

export async function syncMarketsFromPolymarket(limit: number = 100) {
  // Supabase removed - market sync disabled
  console.log('⚠️  Market sync disabled - Supabase removed');
  return { success: false, message: 'Database not configured. Supabase has been removed.' };
}

export async function cleanupOldMarkets() {
  // Supabase removed
  console.log('⚠️  Market cleanup disabled - Supabase removed');
}

