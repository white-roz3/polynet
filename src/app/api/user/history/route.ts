import { NextResponse } from 'next/server'

export async function GET() {
  // Supabase removed
  return NextResponse.json({
    success: true,
    history: []
  })
}
