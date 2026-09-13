import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import type { Metadata } from 'next'
import type { Page } from '@/types'
import { PageView } from './PageView'

// Owner-supplied IDs end up interpolated into inline scripts below, so they're
// validated against the exact shape Google/Meta issue before use (fail closed
// on anything else) rather than escaped.
const GA4_ID_RE = /^G-[A-Z0-9]+$/
const META_PIXEL_ID_RE = /^\d{10,20}$/

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

  const ga4Id = page.settings.pixels?.ga4Id
  const metaPixelId = page.settings.pixels?.metaPixelId
  const validGa4Id = ga4Id && GA4_ID_RE.test(ga4Id) ? ga4Id : null
  const validMetaPixelId = metaPixelId && META_PIXEL_ID_RE.test(metaPixelId) ? metaPixelId : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {validGa4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${validGa4Id}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${validGa4Id}');`}
          </Script>
        </>
      )}
      {validMetaPixelId && (
        <>
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${validMetaPixelId}');
              fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${validMetaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
      <PageView page={page} />
    </>
  )
}
