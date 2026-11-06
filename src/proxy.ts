import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/editor', '/admin']
const AUTH_ONLY = ['/auth']

const CSP_PATHS = ['/dashboard', '/editor', '/admin', '/auth']

// Strict, nonce-based CSP for the logged-in app. These routes are dynamic
// anyway (they read the session), so per-request nonces cost nothing. Public
// pages (/p, landing) stay statically rendered and keep the baseline headers
// from next.config.ts -- a nonce there would force dynamic rendering.
function buildCsp(nonce: string): string {
  let supabase = ''
  try { supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').origin } catch { /* unset in CI */ }
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabase}`.trim(),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Dev needs eval/HMR, so the CSP is production-only.
  const csp = process.env.NODE_ENV === 'production' && CSP_PATHS.some(r => pathname.startsWith(r))
    ? buildCsp(Buffer.from(crypto.randomUUID()).toString('base64'))
    : null
  const next = () => {
    // Next reads the nonce from the *request* CSP header and stamps its own
    // scripts with it; the same header goes on the response for the browser.
    const headers = new Headers(request.headers)
    if (csp) headers.set('Content-Security-Policy', csp)
    const r = NextResponse.next({ request: { headers } })
    if (csp) r.headers.set('Content-Security-Policy', csp)
    return r
  }
  // Safety net: if Supabase sends the sign-in link to the Site URL root
  // (`/?code=...`, e.g. when the exact redirect URL isn't in its allow-list),
  // hand the code to the real callback instead of showing the landing.
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  let response = next()

  // Without Supabase configured the session check cannot run. Don't take every
  // page down with it: public pages keep working, private ones go to /auth.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (PROTECTED.some(r => pathname.startsWith(r))) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      url.search = '?error=config'
      return NextResponse.redirect(url)
    }
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = next()
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (PROTECTED.some(r => pathname.startsWith(r)) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (AUTH_ONLY.some(r => pathname.startsWith(r)) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
