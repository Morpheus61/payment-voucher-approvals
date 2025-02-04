import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://usdlagyqeaveewjlncjk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZGxhZ3lxZWF2ZWV3amxuY2prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTMyMzEsImV4cCI6MjA1Mzg2OTIzMX0.fHQL6Ic11Vj8TVyJ41t9MQRZscAINZhh1ijhvyaZLBI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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
    },
    cookieOptions: {
      name: 'sb-auth-token',
      lifetime: 60 * 60 * 24 * 7, // 1 week
      domain: 'foodstream.in',
      path: '/',
      sameSite: 'lax',
      secure: true
    }
  }
})
