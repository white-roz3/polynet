import { NextResponse } from 'next/server';
import { getAllAgents, getCelebrityAgents } from '@/lib/db/agents';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const celebritiesOnly = searchParams.get('celebrities') === 'true';
    
    console.log('[API /agents] Fetching agents, celebritiesOnly:', celebritiesOnly);
    console.log('[API /agents] CWD:', process.cwd());
    console.log('[API /agents] DB path would be:', path.join(process.cwd(), 'poly402.db'));
    
    let agents: any[] = [];
    try {
      // Try to get agents from database
      if (celebritiesOnly) {
        agents = getCelebrityAgents();
      } else {
        agents = getAllAgents();
      }
      console.log(`[API /agents] Retrieved ${agents.length} agents from database`);
      
      // If no agents, try direct database access as fallback
      if (agents.length === 0) {
        console.log('[API /agents] No agents from functions, trying direct DB access...');
        try {
          const Database = require('better-sqlite3');
          const dbPath = path.join(process.cwd(), 'poly402.db');
          const db = new Database(dbPath);
          const stmt = db.prepare('SELECT * FROM agents ORDER BY created_at DESC');
          agents = stmt.all();
          console.log(`[API /agents] Direct DB access found ${agents.length} agents`);
          db.close();
        } catch (directError: any) {
          console.error('[API /agents] Direct DB access failed:', directError.message);
        }
      }
    } catch (dbError: any) {
      console.error('[API /agents] Database error fetching agents:', dbError);
      console.error('[API /agents] Database error stack:', dbError?.stack);
      // Return empty array if database fails - don't throw
      agents = [];
    }
    
    // Parse traits JSON string back to object
    let formattedAgents = agents.map(agent => {
      try {
        return {
          ...agent,
          traits: agent.traits ? (typeof agent.traits === 'string' ? JSON.parse(agent.traits) : agent.traits) : null,
          is_celebrity: agent.is_celebrity === 1,
          is_active: true,
          is_bankrupt: false,
          accuracy: agent.accuracy || 0,
          total_predictions: agent.total_predictions || 0,
          balance: agent.balance || 1000,
          current_balance_usdt: agent.balance || 1000,
          roi: 0
        };
      } catch (parseError) {
        return {
          ...agent,
          traits: null,
          is_celebrity: agent.is_celebrity === 1,
          is_active: true,
          is_bankrupt: false,
          accuracy: agent.accuracy || 0,
          total_predictions: agent.total_predictions || 0,
          balance: agent.balance || 1000,
          current_balance_usdt: agent.balance || 1000,
          roi: 0
        };
      }
    });
    
    // Replace any Mistral agents with DeepSeek
    formattedAgents = formattedAgents.map(agent => {
      if (agent.name === 'Mistral-Large' || 
          agent.celebrity_model?.toLowerCase().includes('mistral') ||
          agent.name?.toLowerCase().includes('mistral')) {
        return {
          ...agent,
          name: 'DeepSeek',
          celebrity_model: 'deepseek-chat',
          description: 'Chinese AI powerhouse. Efficient, accurate, and cost-effective reasoning.',
          traits: {
            ...(agent.traits || {}),
            avatar: '🔷',
            color: 'blue',
            personality: 'efficient',
            apiProvider: 'openai'
          }
        };
      }
      return agent;
    });
    
    return NextResponse.json({
      success: true,
      agents: formattedAgents
    });
    
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { success: true, agents: [], error: error.message },
      { status: 200 }
    );
  }
}
