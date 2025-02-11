import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

// Admin client for server-side operations only
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Client for user authentication
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export const checkAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export const requireAuth = async () => {
  const session = await checkAuth()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

export const getBiometricCredential = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('biometric_credentials')
    .select('credential_id')
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const storeBiometricCredential = async (userId: string, credentialId: string, publicKey: string) => {
  const { error } = await supabaseAdmin
    .from('biometric_credentials')
    .upsert({
      user_id: userId,
      credential_id: credentialId,
      public_key: publicKey
    })
  
  if (error) throw error
}
