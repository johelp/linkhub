import { createClient } from '@/lib/supabase/server'
import { getOwnerAvailability } from '@/lib/billing.server'
import { getPublicKnowledge } from '@/lib/knowledge.server'
import { buildLlmsText, extractFacts } from '@/lib/seo'
import type { Page } from '@/types'

// Clean Markdown version of a customer's page for AI assistants and crawlers.
export const revalidate = 300

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await (await createClient()).from('pages').select('*').eq('slug', slug).eq('published', true).single()
  const page = data as unknown as Page | null
  if (!page || page.settings.seo.noindex || (await getOwnerAvailability(page.user_id)) === 'paused') return new Response('Not found', { status: 404 })
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app').replace(/\/$/, '')
  return new Response(buildLlmsText(page, base, extractFacts(page, page.settings.defaultLang, await getPublicKnowledge(page.user_id, page.id))), { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } })
}
