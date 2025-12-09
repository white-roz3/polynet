import getDb, { initDatabase } from './sqlite';
import { ethers } from 'ethers';
import { CELEBRITY_AGENTS } from '../celebrity-agents';

// Ensure database is initialized (lazy, only when needed)
let dbInitialized = false;
function ensureDbInitialized() {
  if (!dbInitialized) {
    try {
      initDatabase();
      dbInitialized = true;
    } catch (error: any) {
      console.error('Failed to initialize database in agents.ts:', error);
    }
  }
}

export interface Agent {
  id: string;
  name: string;
  strategy: string;
  balance: number;
  accuracy: number;
  total_predictions: number;
  is_celebrity: boolean;
  celebrity_model?: string;
  avatar?: string;
  traits?: string; // JSON string
  wallet_address?: string;
  created_at: string;
}

// Get all agents
export function getAllAgents(): Agent[] {
  try {
    ensureDbInitialized();
    const db = getDb();
    if (!db) {
      console.error('Database not available in getAllAgents');
      return [];
    }
    const stmt = db.prepare('SELECT * FROM agents ORDER BY created_at DESC');
    const results = stmt.all() as Agent[];
    console.log(`[getAllAgents] Found ${results.length} agents`);
    return results;
  } catch (error: any) {
    console.error('Error in getAllAgents:', error);
    console.error('Error stack:', error?.stack);
    return [];
  }
}

// Get celebrity agents
export function getCelebrityAgents(): Agent[] {
  try {
    ensureDbInitialized();
    const db = getDb();
    if (!db) {
      console.error('Database not available in getCelebrityAgents');
      return [];
    }
    const stmt = db.prepare('SELECT * FROM agents WHERE is_celebrity = 1 ORDER BY created_at DESC');
    const results = stmt.all() as Agent[];
    console.log(`[getCelebrityAgents] Found ${results.length} agents`);
    return results;
  } catch (error: any) {
    console.error('Error in getCelebrityAgents:', error);
    console.error('Error stack:', error?.stack);
    return [];
  }
}

// Get single agent
export function getAgent(id: string): Agent | undefined {
  try {
    const db = getDb();
    if (!db) {
      console.error('Database not available in getAgent');
      return undefined;
    }
    const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
    return stmt.get(id) as Agent | undefined;
  } catch (error) {
    console.error('Error in getAgent:', error);
    return undefined;
  }
}

// Insert agent
export function insertAgent(agent: Omit<Agent, 'created_at'>) {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO agents (id, name, strategy, balance, accuracy, total_predictions, is_celebrity, celebrity_model, avatar, traits, wallet_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      agent.id,
      agent.name,
      agent.strategy,
      agent.balance,
      agent.accuracy || 0,
      agent.total_predictions || 0,
      agent.is_celebrity ? 1 : 0,
      agent.celebrity_model || null,
      agent.avatar || null,
      agent.traits || null,
      agent.wallet_address || null
    );
  } catch (error) {
    console.error('Error in insertAgent:', error);
    throw error;
  }
}

// Seed celebrity agents
export function seedCelebrityAgents() {
  console.log('🌱 Seeding celebrity AI agents...\n');
  
  let added = 0;
  let skipped = 0;
  
  const db = getDb();
  
  for (const celebrity of CELEBRITY_AGENTS) {
    try {
      // Check if already exists
      const existing = db.prepare('SELECT id FROM agents WHERE name = ? AND is_celebrity = 1').get(celebrity.name);
      
      if (existing) {
        console.log(`⏭️  ${celebrity.avatar} ${celebrity.name} already exists, skipping...`);
        skipped++;
        continue;
      }
      
      // Generate wallet
      const wallet = ethers.Wallet.createRandom();
      
      // Create agent
      const agentId = `celebrity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const traits = {
        avatar: celebrity.avatar,
        color: celebrity.color,
        personality: celebrity.personality,
        systemPrompt: celebrity.systemPrompt,
        apiProvider: (celebrity as any).apiProvider || 'anthropic'
      };
      
      insertAgent({
        id: agentId,
        name: celebrity.name,
        strategy: celebrity.strategy_type,
        balance: celebrity.initial_balance,
        accuracy: 0,
        total_predictions: 0,
        is_celebrity: true,
        celebrity_model: celebrity.model,
        avatar: celebrity.avatar,
        traits: JSON.stringify(traits),
        wallet_address: wallet.address
      });
      
      console.log(`✨ Created: ${celebrity.avatar} ${celebrity.name} (${celebrity.model})`);
      added++;
      
    } catch (error: any) {
      console.error(`❌ Failed to seed ${celebrity.name}:`, error.message);
    }
  }
  
  console.log(`\n✅ Celebrity agent seeding complete!`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}\n`);
  
  return { added, skipped };
}

