import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Page, Lang } from '@/types'
import { PageView } from './PageView'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('pages')
    .select('name, settings')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!data) return { title: 'Página no encontrada' }

  const settings = data.settings as unknown as Page['settings']
  return {
    title: settings.seo.title || data.name,
    description: settings.seo.description || undefined,
    openGraph: {
      title: settings.seo.title || data.name,
      description: settings.seo.description || undefined,
      images: settings.seo.ogImage ? [settings.seo.ogImage] : [],
    },
    robots: { index: true, follow: true },
  }
}

export const revalidate = 60 // ISR: revalidate every 60s

export default async function PublicPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!data) notFound()

  const page = data as unknown as Page

  // Structured data for LLMs and search engines
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.settings.seo.title || page.name,
    description: page.settings.seo.description,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/p/${page.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageView page={page} />
    </>
  )
}
