import type { NextConfig } from 'next'

// Baseline hardening headers for every route. A full script-src CSP needs
// per-request nonces (and so dynamic rendering of the public pages) -- tracked
// in security/05-plan-remediacion.md; until then we ship the CSP directives
// that carry no compatibility risk.
const baseHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy', value: "base-uri 'self'; object-src 'none'; form-action 'self' https://*.mercadopago.com https://*.mercadopago.com.ar https://checkout.stripe.com https://sis.redsys.es https://sis-t.redsys.es:25443" },
]

// Private areas must never be framed (clickjacking on admin / billing actions).
const noFrameHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Cache-Control', value: 'no-store' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'snowmotion.es' },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: baseHeaders },
      ...['/dashboard/:path*', '/editor/:path*', '/admin/:path*', '/auth/:path*', '/api/:path*'].map(source => ({
        source,
        headers: noFrameHeaders,
      })),
      { source: '/p/:slug*', headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
    ]
  },
}

export default nextConfig
