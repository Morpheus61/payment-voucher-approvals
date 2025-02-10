// app/api/verify-env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  // Check client-side required variables
  const clientEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  }

  // Check server-side required variables
  const serverEnvVars = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  }

  // Check client-side variables
  const missingClientVars = Object.entries(clientEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  // Check server-side variables
  const missingServerVars = Object.entries(serverEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingClientVars.length > 0 || missingServerVars.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing environment variables',
        missingClientVars: missingClientVars.length > 0 ? missingClientVars : undefined,
        missingServerVars: missingServerVars.length > 0 ? missingServerVars : undefined,
        status: 'error'
      },
      { status: 500 }
    )
  }

  // Return masked values for security
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10)}...`,
    serviceRoleKey: `${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10)}...`,
    vapidPublicKey: `${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.slice(0, 10)}...`,
    vapidPrivateKey: `${process.env.VAPID_PRIVATE_KEY?.slice(0, 10)}...`,
    status: 'success'
  })
}