import { createClient } from '@/lib/supabase/server'
import { getOwnerAvailability } from '@/lib/billing.server'
import { buildVCard } from '@/lib/vcard'
import { extractFacts } from '@/lib/seo'
import type { Page, VCardBlock } from '@/types'

// "Save to contacts": a .vcf built from the page's own data (and the vCard
// block's overrides, when the owner added one).
export const revalidate = 300

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await (await createClient()).from('pages').select('*').eq('slug', slug).eq('published', true).single()
  const page = data as unknown as Page | null
  if (!page || (await getOwnerAvailability(page.user_id)) === 'paused') return new Response('Not found', { status: 404 })
  const facts = extractFacts(page)
  const block = page.blocks.find(b => b.type === 'vcard' && b.visible) as VCardBlock | undefined
  const d = block?.data
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app').replace(/\/$/, '')
  const body = buildVCard({
    name: d?.fullName || page.name, organization: d?.organization || (d?.fullName ? page.name : undefined), title: d?.jobTitle || facts.tagline || undefined,
    phone: d?.phone || facts.phone, whatsapp: facts.whatsapp, email: d?.email || facts.email, url: `${base}/p/${page.slug}`, address: d?.address || facts.address,
    note: d?.note, photoUrl: page.settings.profile?.avatarUrl,
  })
  const file = (d?.fullName || page.name).normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'contacto'
  return new Response(body, { headers: { 'Content-Type': 'text/vcard; charset=utf-8', 'Content-Disposition': `attachment; filename="${file}.vcf"`, 'Cache-Control': 'public, s-maxage=300' } })
}
