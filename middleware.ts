import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          res.cookies.delete({ name, ...options })
        }
      }
    }
  )

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

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

// Update config to match all routes except public ones
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
