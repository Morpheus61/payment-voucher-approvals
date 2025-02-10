// lib/supabaseClient.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'

export const supabase = (() => {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client should only be initialized in the browser')
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !key) {
    throw new Error(`
      Missing Supabase configuration!
      Verify Vercel environment variables:
      - NEXT_PUBLIC_SUPABASE_URL: ${url ? '✓' : '✗'}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key ? '✓' : '✗'}
    `)
  }

  try {
    return createBrowserClient(url, key)
  } catch (error) {
    console.error('Supabase initialization error:', error)
    throw new Error('Failed to initialize Supabase client')
  }
})()