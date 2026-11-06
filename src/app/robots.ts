import type { MetadataRoute } from 'next'
import { isProduction } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app'
  // Staging and previews must never be indexed.
  if (!isProduction()) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard', '/editor', '/admin', '/api'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
