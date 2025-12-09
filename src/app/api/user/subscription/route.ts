import { NextResponse } from 'next/server'

export async function GET() {
  // Supabase removed
  return NextResponse.json({ 
    subscription_tier: 'free',
    subscription_status: 'inactive' 
  })
}
