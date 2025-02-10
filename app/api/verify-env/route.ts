import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.length > 0,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length > 0,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.length > 0
  })
}
