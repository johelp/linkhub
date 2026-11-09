import type { MetadataRoute } from 'next'
import { QR_TOOLS } from '@/lib/qrTools'
import { VERTICALS } from '@/lib/verticals'
import { isProduction } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'
import { availability, graceDays } from '@/lib/billing'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app'
  if (!isProduction()) return []

  // Customers' published pages: the long tail that makes the platform findable.
  // Skipped: opted out of indexing, moderated, or paused for non-payment.
  let customerPages: MetadataRoute.Sitemap = []
  try {
    const admin = createAdminClient()
    const { data: pages } = await admin.from('pages').select('slug, updated_at, settings, user_id').eq('published', true).limit(5000)
    const owners = [...new Set((pages ?? []).map(p => p.user_id))]
    const { data: lapsed } = owners.length ? await admin.from('profiles').select('id, billing_lapsed_at').in('id', owners).not('billing_lapsed_at', 'is', null) : { data: [] }
    const paused = new Set((lapsed ?? []).filter(l => availability((l as { billing_lapsed_at: string }).billing_lapsed_at, Date.now(), graceDays()) === 'paused').map(l => l.id))
    customerPages = (pages ?? [])
      .filter(p => !paused.has(p.user_id) && !(p.settings as { seo?: { noindex?: boolean } })?.seo?.noindex)
      .map(p => ({ url: `${base}/p/${p.slug}`, lastModified: new Date(p.updated_at), changeFrequency: 'weekly' as const, priority: 0.6 }))
  } catch { /* DB unreachable at build: ship the static part only */ }

  return [
    ...customerPages,
    ...['privacidad', 'terminos', 'cookies'].map(d => ({ url: `${base}/legal/${d}`, changeFrequency: 'yearly' as const, priority: 0.2 })),
    { url: `${base}/ejemplos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/auth`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/para`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    ...VERTICALS.map(v => ({
      url: `${base}/para/${v.slug}`, lastModified: new Date(),
      changeFrequency: 'monthly' as const, priority: 0.7,
    })),
    { url: `${base}/herramientas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    ...QR_TOOLS.map(t => ({
      url: `${base}/herramientas/${t.slug}`, lastModified: new Date(),
      changeFrequency: 'monthly' as const, priority: 0.6,
    })),
  ]
}
