import { NextResponse } from 'next/server';
import { getAllAgents, getCelebrityAgents } from '@/lib/db/agents';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const celebritiesOnly = searchParams.get('celebrities') === 'true';
    
    let agents;
    if (celebritiesOnly) {
      agents = getCelebrityAgents();
    } else {
      agents = getAllAgents();
    }
    
    // Parse traits JSON string back to object
    let formattedAgents = agents.map(agent => ({
      ...agent,
      traits: agent.traits ? JSON.parse(agent.traits) : null,
      is_celebrity: agent.is_celebrity === 1,
      is_active: true,
      is_bankrupt: false
    }));
    
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
            ...agent.traits,
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
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
