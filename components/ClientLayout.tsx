'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from 'cookies-next'
import { supabase } from '@/lib/supabaseClient'
import { AuthProvider } from '@/components/AuthProvider'
import InstallPrompt from '@/components/InstallPrompt'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      const currentToken = getCookie('sb-access-token')
      
      if (session?.access_token !== currentToken) {
        if (session) {
          document.cookie = `sb-access-token=${session.access_token}; path=/; secure; samesite=strict; max-age=604800`
        }
        router.refresh()
      }
    })
    return () => subscription?.unsubscribe()
  }, [router])

  return (
    <AuthProvider>
      <InstallPrompt />
      {children}
    </AuthProvider>
  )
}
