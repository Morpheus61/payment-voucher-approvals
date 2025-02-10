// lib/supabaseClient.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'

let supabase: ReturnType<typeof createBrowserClient> | undefined

if (typeof window !== 'undefined') {
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

  supabase = createBrowserClient(url, key)
}

export { supabase }