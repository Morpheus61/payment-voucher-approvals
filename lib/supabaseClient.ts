// lib/supabaseClient.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || supabaseUrl === 'undefined') {
  throw new Error(`
    Missing NEXT_PUBLIC_SUPABASE_URL!
    Check Vercel Environment Variables:
    - Must be exposed to browser
    - No trailing slashes
    - Should match: https://[id].supabase.co
  `)
}

if (!supabaseKey || supabaseKey === 'undefined') {
  throw new Error(`
    Missing NEXT_PUBLIC_SUPABASE_ANON_KEY!
    Check Vercel Environment Variables:
    - Must be exposed to browser
    - Should start with eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
  `)
}

export const supabase = createBrowserClient(supabaseUrl, supabaseKey)