import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard', '/editor', '/api'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
