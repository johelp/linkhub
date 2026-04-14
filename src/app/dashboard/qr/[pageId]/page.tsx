'use client'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function QRPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params)
  const [slug, setSlug] = useState<string | null>(null)
  const [pageName, setPageName] = useState('')
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    const supabase = createClient()
    supabase.from('pages').select('slug, name').eq('id', pageId).single()
      .then(({ data }) => {
        if (data) { setSlug(data.slug); setPageName(data.name) }
      })
  }, [pageId])

  const qrSvgUrl = slug ? `/api/qr?slug=${slug}&format=svg` : null
  const qrPngUrl = slug ? `/api/qr?slug=${slug}&format=png` : null
  const pageUrl = slug && origin ? `${origin}/p/${slug}` : ''

  function copyUrl() {
    navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('URL copiada')
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#9A9D9F', textDecoration: 'none' }}>← Dashboard</Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 8, color: '#1A1B1C' }}>QR · {pageName}</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12, border: '1px solid rgba(26,27,28,0.09)' }}>
        {qrSvgUrl ? (
          <img src={qrSvgUrl} alt="QR Code" width={220} height={220} style={{ borderRadius: 12 }} />
        ) : (
          <div style={{ width: 220, height: 220, borderRadius: 12, background: '#F6F6F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A9D9F', fontSize: 13 }}>Cargando...</div>
        )}
        <p style={{ fontSize: 12, marginTop: 16, color: '#9A9D9F', fontWeight: 500 }}>Apuntá la cámara para abrir la página</p>
      </div>

      {pageUrl && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, border: '1px solid rgba(26,27,28,0.09)' }}>
          <span style={{ fontSize: 13, color: '#1A1B1C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pageUrl}</span>
          <button onClick={copyUrl} style={{ marginLeft: 12, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#16A34A' : '#9A9D9F' }}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <a href={qrSvgUrl || '#'} download={`qr-${slug}.svg`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, background: '#FEF0EF', color: '#E8150A', textDecoration: 'none' }}>
          <Download size={14} /> SVG
        </a>
        <a href={qrPngUrl || '#'} download={`qr-${slug}.png`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, background: '#E8150A', color: '#fff', textDecoration: 'none' }}>
          <Download size={14} /> PNG
        </a>
      </div>
      <p style={{ fontSize: 11, textAlign: 'center', marginTop: 12, color: '#9A9D9F' }}>SVG para imprimir · PNG para redes sociales</p>
    </div>
  )
}
