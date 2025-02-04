import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const { data: { session }, error } = await supabase.auth.getSession()

  // Public paths that don't require authentication
  const isPublicPath = req.nextUrl.pathname === '/' || 
                      req.nextUrl.pathname.startsWith('/_next') || 
                      req.nextUrl.pathname.startsWith('/api')

  if (isPublicPath) {
    return res
  }

  // If there's no session and trying to access protected route, redirect to login
  if (!session && !isPublicPath) {
    const redirectUrl = new URL('/', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Update config to exclude public paths
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
