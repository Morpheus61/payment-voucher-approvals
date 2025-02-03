import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not signed in and the current path is not / redirect the user to /
  if (!session && req.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // If user is signed in and the current path is / redirect to appropriate page
  if (session && req.nextUrl.pathname === '/') {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userData) {
      switch (userData.role) {
        case 'admin':
          return NextResponse.redirect(new URL('/admin', req.url))
        case 'approver':
          return NextResponse.redirect(new URL('/approver', req.url))
        case 'requester':
          return NextResponse.redirect(new URL('/requester', req.url))
        default:
          return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
