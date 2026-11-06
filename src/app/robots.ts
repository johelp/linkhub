import type { MetadataRoute } from 'next'
import { isProduction } from '@/lib/env'

// AI assistants and search crawlers are welcome on public pages (that is the
// point of GEO); everything private stays out for everyone.
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'Googlebot']
const PUBLIC_ALLOW = ['/', '/p/', '/llms.txt']
const PRIVATE = ['/dashboard', '/editor', '/admin', '/api', '/auth']

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app'
  // Staging and previews must never be indexed.
  if (!isProduction()) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: PUBLIC_ALLOW, disallow: PRIVATE },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
