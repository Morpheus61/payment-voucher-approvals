// lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!supabaseAnonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined')
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
}

let instance: SupabaseClient | null = null

declare global {
  interface Window {
    __SUPABASE_CLIENT__?: SupabaseClient
  }
}

export const supabase = (() => {
  try {
    if (typeof window === 'undefined') {
      // Server-side: Always create a new instance
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })
    }

    // Client-side: Use singleton pattern
    if (window.__SUPABASE_CLIENT__) {
      return window.__SUPABASE_CLIENT__
    }

    if (!instance) {
      console.log('[Supabase] Creating new client instance')
      instance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })
      window.__SUPABASE_CLIENT__ = instance
    }

    return instance
  } catch (error) {
    console.error('[Supabase] Error creating client:', error)
    throw error
  }
})()