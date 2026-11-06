import { createClient } from '@/lib/supabase/server'
import { getOwnerAvailability } from '@/lib/billing.server'
import { buildStructuredData, extractFacts } from '@/lib/seo'
import type { Page } from '@/types'

// The same facts as the page, machine-readable (for agents, chatbots, integrations).
export const revalidate = 300

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await (await createClient()).from('pages').select('*').eq('slug', slug).eq('published', true).single()
  const page = data as unknown as Page | null
  if (!page || page.settings.seo.noindex || (await getOwnerAvailability(page.user_id)) === 'paused') return Response.json({ error: 'not_found' }, { status: 404 })
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app').replace(/\/$/, '')
  return Response.json({ slug: page.slug, url: `${base}/p/${page.slug}`, facts: extractFacts(page), structuredData: buildStructuredData(page, base) },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } })
}
