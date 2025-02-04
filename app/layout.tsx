import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import InstallPrompt from '@/components/InstallPrompt'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { getCookie } from 'cookies-next'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Relish Approvals',
  description: 'Manage and approve payment vouchers for Relish Hao Hao Chi Foods',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Relish Approvals',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [supabase] = useState(() => createBrowserClient())
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentToken = getCookie('sb-access-token');
      
      if (session?.access_token !== currentToken) {
        if (session) {
          document.cookie = `sb-access-token=${session.access_token}; path=/; secure; samesite=strict; max-age=604800`;
        }
        router.refresh();
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  )
}
