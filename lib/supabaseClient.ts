import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Global variable for browser environment
declare global {
  interface Window {
    __SUPABASE_CLIENT__?: SupabaseClient
  }
}

export const supabase = (() => {
  // Return existing instance if available
  if (typeof window !== 'undefined' && window.__SUPABASE_CLIENT__) {
    return window.__SUPABASE_CLIENT__
  }

  // Create new instance
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: {
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
        removeItem: (key) => window.localStorage.removeItem(key)
      }
    },
    global: {
      headers: {
        'X-Supabase-Api-Version': '2024-01-01'
      }
    }
  })

  // Store in global variable for browser
  if (typeof window !== 'undefined') {
    window.__SUPABASE_CLIENT__ = client
  }

  return client
})()