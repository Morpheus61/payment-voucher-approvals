import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables for biometric verification')
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    // Get the session cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session cookie found' }, { status: 401 })
    }

    // Verify the session with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(sessionCookie.value)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Verify that the authenticated user matches the requested user ID
    if (user.id !== userId) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 })
    }

    return NextResponse.json({ verified: true })
  } catch (error) {
    console.error('Biometric verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
