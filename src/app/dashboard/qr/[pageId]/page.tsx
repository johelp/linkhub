'use client'
import { useEffect, useState } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { use } from 'react'

export default function QRPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params)
  const [slug, setSlug] = useState<string | null>(null)
  const [pageName, setPageName] = useState('')
  const [copied, setCopied] = useState(false)
  const { createClient } = require('@/lib/supabase/client')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('pages').select('slug, name').eq('id', pageId).single()
      .then(({ data }: any) => {
        if (data) { setSlug(data.slug); setPageName(data.name) }
      })
  }, [pageId])

  const qrSvgUrl = slug ? `/api/qr?slug=${slug}&format=svg` : null
  const qrPngUrl = slug ? `/api/qr?slug=${slug}&format=png` : null
  const pageUrl = slug ? `${window?.location?.origin}/p/${slug}` : ''

  function copyUrl() {
    navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('URL copiada')
  }

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm" style={{ color: '#9A9D9F' }}>← Dashboard</Link>
        <h1 className="text-xl font-bold mt-2" style={{ color: '#1A1B1C' }}>QR · {pageName}</h1>
      </div>

      {/* QR Display */}
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center mb-4"
        style={{ border: '1px solid rgba(26,27,28,0.09)' }}>
        {qrSvgUrl ? (
          <img src={qrSvgUrl} alt="QR Code" width={220} height={220} className="rounded-xl" />
        ) : (
          <div className="w-56 h-56 rounded-xl flex items-center justify-center" style={{ background: '#F6F6F5' }}>
            <span style={{ color: '#9A9D9F' }}>Cargando...</span>
          </div>
        )}
        <p className="text-xs mt-4 font-medium" style={{ color: '#9A9D9F' }}>
          Apunta la cámara para abrir la página
        </p>
      </div>

      {/* URL */}
      <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between mb-4"
        style={{ border: '1px solid rgba(26,27,28,0.09)' }}>
        <span className="text-sm truncate" style={{ color: '#1A1B1C' }}>{pageUrl}</span>
        <button onClick={copyUrl} className="ml-3 flex-shrink-0" style={{ color: copied ? '#16A34A' : '#9A9D9F' }}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {/* Download */}
      <div className="flex gap-3">
        <a href={qrSvgUrl || '#'} download={`qr-${slug}.svg`}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
          style={{ background: '#FEF0EF', color: '#E8150A' }}>
          <Download size={15} /> Descargar SVG
        </a>
        <a href={qrPngUrl || '#'} download={`qr-${slug}.png`}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#E8150A' }}>
          <Download size={15} /> Descargar PNG
        </a>
      </div>

      <p className="text-xs text-center mt-4" style={{ color: '#9A9D9F' }}>
        Tip: El SVG es ideal para imprimir. El PNG para usar en redes sociales.
      </p>
    </div>
  )
}
