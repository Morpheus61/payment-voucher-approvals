import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton pattern for client instance
let supabase: ReturnType<typeof createClient>

function getSupabaseClient() {
  if (supabase) return supabase

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: {
        getItem: (key) => {
          if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key)
          }
          return null
        },
        setItem: (key, value) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value)
          }
        },
        removeItem: (key) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key)
          }
        }
      }
    },
    global: {
      headers: {
        'X-Supabase-Api-Version': '2024-01-01'
      }
    }
  })

  return supabase
}

// Export a singleton instance
export const supabase = getSupabaseClient()
