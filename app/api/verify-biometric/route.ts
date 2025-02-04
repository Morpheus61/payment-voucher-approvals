import { NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase configuration is missing - check environment variables')
}

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase configuration');
    }
    
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

    // After successful biometric verification
    await supabase.auth.admin.updateUserById(credential.user_id, {
      password: Math.random().toString(36).slice(-8) // Invalidate temporary password
    })

    // Refresh user session
    const { data: refreshedSession } = await supabase.auth.refreshSession()
    if (!refreshedSession?.user) throw new Error('Session refresh failed')

    // Set secure HTTP-only cookie
    const cookie = `sb-access-token=${refreshedSession.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`;
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Set-Cookie': cookie }
    })
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}
