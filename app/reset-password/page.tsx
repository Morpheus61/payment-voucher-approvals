// app/reset-password/page.tsx
'use client'

import { Suspense } from 'react'
import dynamicImport from 'next/dynamic' // Renamed import

const ResetPasswordForm = dynamicImport(
  () => import('@/components/ResetPasswordForm'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }
)

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

// Configuration export remains the same
export const dynamic = 'force-dynamic'