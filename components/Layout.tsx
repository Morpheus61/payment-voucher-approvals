// app/layout.tsx
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  useEffect(() => {
    console.log('Supabase client initialized:', !!supabase)
  }, [])
  
  return <>{children}</>
}