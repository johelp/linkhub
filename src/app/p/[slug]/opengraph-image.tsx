import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import type { Page } from '@/types'

// Branded social/AI preview card, generated from the page's own name, tagline
// and colour (used when the owner didn't upload an OG image).
export const alt = 'Vista previa de la página'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 3600

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await (await createClient()).from('pages').select('name, settings').eq('slug', slug).eq('published', true).single()
  const settings = (data?.settings ?? {}) as unknown as Page['settings']
  const name = data?.name ?? 'LinkHub'
  const tagline = settings.profile?.tagline ?? settings.seo?.description ?? ''
  const color = /^#[0-9a-fA-F]{6}$/.test(settings.primaryColor ?? '') ? settings.primaryColor : '#1A1B1C'
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#FAFAF8', color: '#111314' }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: color, color: '#fff', fontSize: 48, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(name.trim()[0] || '•').toUpperCase()}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>{name.slice(0, 48)}</div>
          {tagline && <div style={{ fontSize: 34, color: '#4A4E52', marginTop: 20, lineHeight: 1.3 }}>{tagline.slice(0, 110)}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 26, color: '#5B6064' }}>
          <span>Reserva, pide y contacta en un solo enlace</span>
          <span style={{ fontWeight: 700, color: '#111314' }}>LinkHub</span>
        </div>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: color }} />
      </div>
    ),
    size
  )
}
