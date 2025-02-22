'use client'
import { useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface BiometricAuthProps {
  userId?: string
}

export default function BiometricAuth({ userId }: BiometricAuthProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleBiometricAuth = async () => {
    if (!userId) {
      toast.error('User ID is required for biometric authentication')
      return
    }

    setLoading(true)
    try {
      // Get authentication options from server
      const optionsRes = await fetch('/api/auth/webauthn')
      const options = await optionsRes.json()

      // Start the authentication process
      const credential = await startAuthentication(options)

      // Send the credential to server for verification
      const verificationRes = await fetch('/api/auth/webauthn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential,
          userId,
        }),
      })

      const verification = await verificationRes.json()

      if (verification.error) {
        throw new Error(verification.error)
      }

      if (verification.success) {
        toast.success('Authentication successful')
        router.push('/admin')
      } else {
        throw new Error('Authentication failed')
      }
    } catch (error) {
      console.error('Biometric authentication error:', error)
      toast.error('Biometric authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBiometricAuth}
      disabled={loading}
      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Authenticating...
        </div>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
              clipRule="evenodd"
            />
          </svg>
          Use Biometric Login
        </>
      )}
    </button>
  )
}
