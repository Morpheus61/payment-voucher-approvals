import { NextRequest, NextResponse } from 'next/server'
import { 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse,
  type VerifyAuthenticationResponseOpts 
} from '@simplewebauthn/server'
import { supabaseAdmin } from '@/lib/auth'
import type { 
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/types'
import { cookies } from 'next/headers'

const rpName = 'Payment Voucher Approvals'
const rpID = process.env.NEXT_PUBLIC_DOMAIN || 'localhost'
const origin = process.env.NODE_ENV === 'production' 
  ? `https://${rpID}`
  : `http://${rpID}:3000`

// Store challenges in memory (in production, use Redis or similar)
const challengeStore = new Map<string, string>()

export async function GET(req: NextRequest) {
  try {
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [], // Will be filled with user's credentials
      userVerification: 'preferred',
    })

    // Store the challenge
    challengeStore.set('current', options.challenge)

    return NextResponse.json(options)
  } catch (error) {
    console.error('Error generating authentication options:', error)
    return NextResponse.json(
      { error: 'Failed to generate authentication options' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { credential, userId } = body as {
      credential: AuthenticationResponseJSON
      userId: string
    }

    // Get the stored challenge
    const expectedChallenge = challengeStore.get('current')
    if (!expectedChallenge) {
      throw new Error('No challenge found')
    }

    // Get user's registered credential
    const { data: userCredential, error: dbError } = await supabaseAdmin
      .from('biometric_credentials')
      .select('credential_id, public_key')
      .eq('user_id', userId)
      .single()

    if (dbError || !userCredential) {
      throw new Error('No registered credential found for user')
    }

    const credentialID = Buffer.from(userCredential.credential_id, 'base64')
    const credentialPublicKey = Buffer.from(userCredential.public_key, 'base64')

    const verifyOptions: VerifyAuthenticationResponseOpts = {
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      expectedAuthentication: {
        credentialID,
        credentialPublicKey,
        counter: 0
      }
    }

    let verification
    try {
      verification = await verifyAuthenticationResponse(verifyOptions)
    } catch (error) {
      console.error('WebAuthn verification error:', error)
      throw new Error('Failed to verify WebAuthn response')
    }

    if (verification.verified) {
      // Get the user
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (userError || !user) throw new Error('User not found')

      if (!user.email) {
        throw new Error('User email not found')
      }

      // Create a new session using the auth API
      const adminPassword = process.env.ADMIN_PASSWORD
      if (!adminPassword) {
        throw new Error('ADMIN_PASSWORD environment variable is not set')
      }

      const { data: { session }, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
        email: user.email,
        password: adminPassword
      })

      if (sessionError) throw sessionError

      // Clear the used challenge
      challengeStore.delete('current')

      // Create the response with the session
      const response = NextResponse.json({ 
        success: true,
        session
      })

      // Set the session cookie
      const cookieStore = cookies()
      if (session) {
        cookieStore.set('sb-access-token', session.access_token, {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        if (session.refresh_token) {
          cookieStore.set('sb-refresh-token', session.refresh_token, {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          })
        }
      }

      return response
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error verifying authentication:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
