import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Supabase removed
  return NextResponse.json({
    error: 'Database not configured. Supabase has been removed.'
  }, { status: 501 })
}
