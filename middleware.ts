import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    let res = NextResponse.next()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.delete({
              name,
              ...options,
            })
          },
        },
      }
    )

    // Public paths that don't require authentication
    const publicPaths = [
      '/',
      '/login',
      '/api',
      '/_next',
      '/static',
      '/favicon.ico',
      '/manifest.json',
      '/sw.js',
      '/workbox-',
      '/icons/'
    ]
    
    const isPublicPath = publicPaths.some(path => 
      req.nextUrl.pathname.startsWith(path) || 
      req.nextUrl.pathname.includes('workbox-') ||
      req.nextUrl.pathname.includes('worker')
    )

    // Check auth status
    const { data: { session } } = await supabase.auth.getSession()

    // Add security headers
    res = NextResponse.next({
      request: {
        headers: req.headers,
      },
    })

    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )
    res.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.resend.com;"
    )

    // Redirect if not authenticated
    if (!session && !isPublicPath) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return res
  } catch (e) {
    // If there is an error, redirect to login page
    return NextResponse.redirect(new URL('/', req.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
