import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getOwnerAvailability } from '@/lib/billing.server'
import { extractFacts, defaultMeta, buildStructuredData } from '@/lib/seo'
import { PausedPage } from './PausedPage'
import { getPublicKnowledge } from '@/lib/knowledge.server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Page } from '@/types'
import { PageView } from './PageView'
import { TrackingConsent } from './TrackingConsent'

// Owner-supplied IDs end up interpolated into inline scripts below, so they're
// validated against the exact shape Google/Meta issue before use (fail closed
// on anything else) rather than escaped.
const GA4_ID_RE = /^G-[A-Z0-9]+$/
const META_PIXEL_ID_RE = /^\d{10,20}$/

interface Props {
  params: Promise<{ slug: string }>
}

// One cached lookup shared by metadata + page (React cache dedupes per request).
const loadPage = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from('pages').select('*').eq('slug', slug).eq('published', true).single()
  if (!data) return null
  const page = data as unknown as Page
  return { page, availability: await getOwnerAvailability(page.user_id), knowledge: await getPublicKnowledge(page.user_id, page.id) }
})

const baseUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app').replace(/\/$/, '')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const loaded = await loadPage(slug)
  if (!loaded) return { title: 'Página no encontrada', robots: { index: false } }
  const { page, availability: av, knowledge } = loaded
  const facts = extractFacts(page, page.settings.defaultLang, knowledge)
  const meta = defaultMeta(page, facts)
  const url = `${baseUrl()}/p/${page.slug}`
  // Paused or opted-out pages stay out of search results and AI answers.
  const indexable = av !== 'paused' && !page.settings.seo.noindex
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: url, types: { 'text/markdown': `${url}/llms.txt`, 'application/json': `${url}/facts.json` } },
    openGraph: {
      type: 'website', url, siteName: 'LinkHub', title: meta.title, description: meta.description, locale: page.settings.defaultLang === 'es' ? 'es_ES' : page.settings.defaultLang,
      ...(page.settings.seo.ogImage ? { images: [page.settings.seo.ogImage] } : {}),   // otherwise the generated opengraph-image applies
    },
    twitter: { card: 'summary_large_image', title: meta.title, description: meta.description },
    robots: indexable ? { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } : { index: false, follow: false },
  }
}

export const revalidate = 60 // ISR: revalidate every 60s (billing events also revalidate on demand)

export default async function PublicPage({ params }: Props) {
  const { slug } = await params
  const loaded = await loadPage(slug)
  if (!loaded) notFound()
  const { page, availability: av, knowledge } = loaded

  // Payment lapsed beyond the grace period: a neutral "back soon" screen.
  if (av === 'paused') return <PausedPage name={page.name} color={page.settings.primaryColor} avatarUrl={page.settings.profile?.avatarUrl} />

  // Structured data (schema.org) chosen from the business type: search engines
  // and AI assistants read this instead of guessing from the layout.
  const jsonLd = buildStructuredData(page, baseUrl(), extractFacts(page, page.settings.defaultLang, knowledge))

  const ga4Id = page.settings.pixels?.ga4Id
  const metaPixelId = page.settings.pixels?.metaPixelId
  const validGa4Id = ga4Id && GA4_ID_RE.test(ga4Id) ? ga4Id : null
  const validMetaPixelId = metaPixelId && META_PIXEL_ID_RE.test(metaPixelId) ? metaPixelId : null

  return (
    <>
      <script
        type="application/ld+json"
        // Escape '<' so owner-controlled text can't close the <script> tag (stored XSS).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {(validGa4Id || validMetaPixelId) && <TrackingConsent ga4Id={validGa4Id} metaPixelId={validMetaPixelId} pageName={page.name} />}
      <PageView page={page} knowledge={knowledge} />
    </>
  )
}
