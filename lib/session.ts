import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const getSession = async (): Promise<{ user: any } | null> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const cookieStore = cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  
  if (!accessToken) return null
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  return error ? null : user
}
