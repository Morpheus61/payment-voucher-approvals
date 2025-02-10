// components/LoginForm.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import BiometricAuth from './BiometricAuth'
import { startAuthentication } from '@simplewebauthn/browser'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

export default function LoginForm(): JSX.Element {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkSession = useCallback(async (): Promise<void> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`)
      }

      if (session?.user) {
        router.push('/admin')
      }
    } catch (error) {
      console.error('Session check failed:', error)
      setError('Failed to check session - please refresh the page')
    }
  }, [router])

  useEffect(() => {
    let subscription: any

    const initAuth = async (): Promise<void> => {
      try {
        const authStateChange = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
          if (session?.user) {
            router.push('/admin')
          }
        })

        subscription = authStateChange.data.subscription
        await checkSession()
      } catch (error) {
        console.error('Auth initialization error:', error)
        setError('Authentication system initialization failed')
      }
    }

    initAuth()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [router, checkSession])

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      if (!supabase) {
        throw new Error('Authentication client not available')
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      if (!data?.user) {
        throw new Error('Authentication failed: No user data received')
      }

      router.push('/admin')
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricLogin = async (): Promise<void> => {
    try {
      const authOptionsResponse = await fetch('/api/auth/webauthn-options')
      if (!authOptionsResponse.ok) {
        throw new Error('Failed to get authentication options')
      }

      const authOptions = await authOptionsResponse.json()
      const asseResp = await startAuthentication(authOptions)

      const verificationResponse = await fetch('/api/auth/webauthn-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asseResp),
      })

      if (!verificationResponse.ok) {
        throw new Error('Biometric verification failed')
      }

      router.refresh()
    } catch (error) {
      console.error('Biometric login failed:', error)
      setError('Biometric authentication failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            src="/Relish Logo with Plate (4).png"
            alt="Relish Logo"
            className="mx-auto h-24 w-auto"
            loading="lazy"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Payment Voucher Approvals
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                disabled={loading}
              />
            </div>
          </div>

          <BiometricAuth handleBiometricLogin={handleBiometricLogin} />

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}