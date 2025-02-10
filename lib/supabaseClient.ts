// lib/supabaseClient.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'

const validateSupabaseConfig = (url: string, key: string) => {
  if (!url.startsWith('https://')) throw new Error('Invalid Supabase URL format')
  if (!key.startsWith('eyJhbGciOiJ')) throw new Error('Invalid Supabase key format')
}

export const supabase = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  
  if (!url || !key) {
    throw new Error('Missing Supabase configuration - check .env files')
  }

  try {
    validateSupabaseConfig(url, key)
    return createBrowserClient(url, key)
  } catch (error) {
    console.error('Supabase initialization failed:', error)
    throw error
  }
})()