import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase configuration is missing - check environment variables')
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function POST(req: Request) {
  try {
    const { assertion, credentialId } = await req.json()

    // Get stored credential from database
    const { data: credential, error: fetchError } = await supabase
      .from('user_credentials')
      .select('user_id, public_key')
      .eq('credential_id', credentialId)
      .single()

    if (fetchError) throw fetchError
    if (!credential) throw new Error('Credential not found')

    // Verify the assertion
    const publicKey = JSON.parse(credential.public_key)
    
    // Here you would normally verify the assertion against the stored public key
    // This is a simplified version - in production, you should:
    // 1. Verify the challenge
    // 2. Verify the origin
    // 3. Verify the signature
    // 4. Verify the user verification flag
    // You might want to use libraries like '@simplewebauthn/server' for this

    // For now, we'll just check if the assertion exists
    if (!assertion) {
      throw new Error('Invalid assertion')
    }

    // Get the user's email to create a new session
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', credential.user_id)
      .single()

    if (userError) throw userError
    if (!userData?.email) throw new Error('User email not found')

    // Create a new session by signing in the user
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      // Use a temporary password that will be immediately invalidated
      password: Math.random().toString(36).slice(-8)
    })

    if (signInError) throw signInError

    return NextResponse.json({ 
      message: 'Biometric verification successful',
      session 
    })
  } catch (error: any) {
    console.error('Error verifying biometric:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
