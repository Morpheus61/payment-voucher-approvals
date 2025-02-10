import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrl: typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' && process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0,
    anonKey: typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0,
    serviceRoleKey: typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string' && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 0
  })
}
