import type { MetadataRoute } from 'next'
import { QR_TOOLS } from '@/lib/qrTools'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/auth`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/herramientas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    ...QR_TOOLS.map(t => ({
      url: `${base}/herramientas/${t.slug}`, lastModified: new Date(),
      changeFrequency: 'monthly' as const, priority: 0.6,
    })),
  ]
}
