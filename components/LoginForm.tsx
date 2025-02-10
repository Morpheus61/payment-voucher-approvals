// components/LoginForm.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import BiometricAuth from './BiometricAuth'
import { startAuthentication } from '@simplewebauthn/browser'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Safe session check with initialization guard
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (session?.user) router.push('/admin')
    } catch (error) {
      console.error('Session check failed:', error)
      setError('Session check failed - please refresh the page')
    }
  }, [router])

  useEffect(() => {
    let subscription: any
    
    try {
      // Initialize auth listener only after client confirmation
      subscription = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) router.push('/admin')
      }).data.subscription

      checkSession()
    } catch (error) {
      console.error('Auth initialization error:', error)
      setError('Authentication system failed to initialize')
    }

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [router, checkSession])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      if (!supabase) throw new Error('Authentication client not available')
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      })

      if (signInError) throw signInError
      if (!data?.user) throw new Error('Authentication failed: No user data')

      router.push('/admin')
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  // ... rest of the component remains unchanged ...
}