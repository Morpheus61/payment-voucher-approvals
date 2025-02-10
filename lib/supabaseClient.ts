// lib/supabaseClient.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`
    Missing environment variables:
    NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓' : '✗'}
  `)
}

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)