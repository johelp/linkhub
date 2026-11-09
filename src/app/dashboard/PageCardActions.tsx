'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { MoreHorizontal, QrCode, Mail, Ticket, Award, BarChart3, Trash2 } from 'lucide-react'

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const BORDER = 'rgba(26,27,28,0.09)'

interface Props { pageId: string; pageName: string }

// Secondary actions live in a labeled menu (a row of bare icons says nothing
// on a phone). Deleting asks for confirmation and refreshes the list.
export function PageCardActions({ pageId, pageName }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  async function remove() {
    if (!window.confirm(`¿Eliminar “${pageName}”? Se borran también sus analíticas y contactos. No se puede deshacer.`)) return
    setBusy(true)
    const res = await fetch(`/api/pages?pageId=${encodeURIComponent(pageId)}`, { method: 'DELETE' })
    setBusy(false)
    if (!res.ok) { toast.error('No se pudo eliminar la página'); return }
    toast.success('Página eliminada')
    setOpen(false)
    router.refresh()
  }

  const items = [
    { href: `/dashboard/analytics?page=${pageId}`, icon: <BarChart3 size={14} />, label: 'Analíticas' },
    { href: `/dashboard/qr/${pageId}`, icon: <QrCode size={14} />, label: 'Código QR' },
    { href: `/dashboard/contacts?page=${pageId}`, icon: <Mail size={14} />, label: 'Contactos' },
    { href: `/dashboard/validate/${pageId}`, icon: <Ticket size={14} />, label: 'Validar entradas' },
    { href: `/dashboard/loyalty/${pageId}`, icon: <Award size={14} />, label: 'Tarjeta de sellos' },
  ]

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Más acciones de ${pageName}`}
        className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[#EDEEEF]" style={{ background: '#F6F6F5', color: MUTED }}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full right-0 mb-1.5 min-w-[210px] z-20 rounded-2xl p-1.5 bg-white"
          style={{ border: `1px solid ${BORDER}`, boxShadow: '0 12px 32px rgba(26,27,28,0.14)' }}>
          {items.map(item => (
            <Link key={item.label} href={item.href} role="menuitem" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium no-underline hover:bg-[#F6F6F5]" style={{ color: INK }}>
              <span style={{ color: MUTED, display: 'flex' }}>{item.icon}</span>{item.label}
            </Link>
          ))}
          <div className="my-1 h-px" style={{ background: BORDER }} />
          <button role="menuitem" onClick={remove} disabled={busy}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium hover:bg-[#FEF0EF] text-left" style={{ color: '#C8110A' }}>
            <Trash2 size={14} />{busy ? 'Eliminando…' : 'Eliminar página'}
          </button>
        </div>
      )}
    </div>
  )
}
