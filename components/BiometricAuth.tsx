'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface BiometricAuthProps {
  handleBiometricLogin: () => Promise<void>;
}

export default function BiometricAuth({ handleBiometricLogin }: BiometricAuthProps) {
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if WebAuthn is supported
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          setBiometricSupported(available)
        })
    }
  }, [])

  const handleRegisterBiometric = async () => {
    try {
      setLoading(true);
      
      // Verify valid session exists
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        throw new Error('Please sign in with your credentials first');
      }

      // Validate active session
      if (!session) {
        throw new Error('Please authenticate with your credentials first');
      }

      // Proceed with WebAuthn registration
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge)

      // Create credential options
      const createCredentialOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: 'Payment Voucher Approvals',
            id: window.location.hostname
          },
          user: {
            id: Uint8Array.from(String(session.user.id), c => c.charCodeAt(0)),
            name: session.user.email!,
            displayName: session.user.email!
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'none'
        }
      }

      // Create credential
      const credential = await navigator.credentials.create(createCredentialOptions)
      if (!credential) throw new Error('Failed to create credential')

      // Store credential ID in Supabase
      const { error: dbError } = await supabase
        .from('user_credentials')
        .insert({
          user_id: session.user.id,
          credential_id: btoa(Array.from(new Uint8Array((credential as PublicKeyCredential).rawId), c => String.fromCharCode(c)).join('')),
          public_key: JSON.stringify(credential),
          created_at: new Date().toISOString()
        })

      if (dbError) throw dbError

      alert('Biometric authentication registered successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const loginWithBiometric = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get stored credential
      const { data: credentials, error: fetchError } = await supabase
        .from('user_credentials')
        .select('credential_id, public_key')
        .single()

      if (fetchError) throw fetchError
      if (!credentials) throw new Error('No registered biometric found')

      // Generate random challenge
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      // Create assertion options
      const assertionOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials: [{
            id: Uint8Array.from(atob(credentials.credential_id), c => c.charCodeAt(0)),
            type: 'public-key'
          }],
          userVerification: 'required',
          timeout: 60000
        }
      }

      // Get assertion
      const assertion = await navigator.credentials.get(assertionOptions)
      if (!assertion) throw new Error('Failed to get assertion')

      // Verify assertion on server (you'll need to implement this)
      const response = await fetch('/api/verify-biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assertion,
          credentialId: credentials.credential_id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      // Refresh the session
      await supabase.auth.refreshSession()
      
      alert('Logged in successfully with biometric!')
    } catch (err) {
      console.error('Error logging in with biometric:', err)
      setError(err instanceof Error ? err.message : 'Failed to login with biometric')
    } finally {
      setLoading(false)
    }
  }

  if (!biometricSupported) {
    return null
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleRegisterBiometric}
        disabled={loading}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 mb-2"
      >
        {loading ? 'Processing...' : 'Register Biometric Login'}
      </button>
      
      <button
        onClick={loginWithBiometric}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Login with Biometric'}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
