import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const LoginForm = dynamic(() => import('@/components/LoginForm'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  ),
})

export default function Home() {
  return <LoginForm />
}
