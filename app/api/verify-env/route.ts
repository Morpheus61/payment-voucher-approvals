// app/api/verify-env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    NODE_ENV: process.env.NODE_ENV
  }

  // Check if any required environment variables are missing
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required environment variables',
        missingVars,
        status: 'error'
      },
      { status: 500 }
    )
  }

  // Return masked values for security
  return NextResponse.json({
    supabaseUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    supabaseKey: `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10)}...`,
    serviceRoleKey: `${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10)}...`,
    vapidPublicKey: `${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.slice(0, 10)}...`,
    vapidPrivateKey: `${process.env.VAPID_PRIVATE_KEY?.slice(0, 10)}...`,
    nodeEnv: process.env.NODE_ENV,
    status: 'success'
  })
}