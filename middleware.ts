import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/api', '/_next', '/static', '/favicon.ico']
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))

  if (isPublicPath) {
    return res
  }

  // Check and refresh session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If there's no session and trying to access protected route, redirect to login
  if (!session) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // For admin routes, check if user has admin role
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      // Redirect non-admin users to home
      const redirectUrl = new URL('/', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

// Update config to match all routes except public ones
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
