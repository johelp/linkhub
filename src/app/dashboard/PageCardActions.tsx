'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MoreHorizontal, QrCode, Mail, Ticket, Award } from 'lucide-react'

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const BORDER = 'rgba(26,27,28,0.09)'

interface Props {
  pageId: string
}

// The secondary actions (QR, export subscribers, validate tickets, loyalty
// card) used to be a row of bare icons with only a `title` tooltip -- fine
// on desktop hover, meaningless on a phone and not self-explanatory even on
// desktop until you've learned what each glyph means. A labeled menu says
// what each link actually does.
export function PageCardActions({ pageId }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const items: { href: string; icon: React.ReactNode; label: string }[] = [
    { href: `/dashboard/qr/${pageId}`, icon: <QrCode size={14} />, label: 'Código QR' },
    { href: `/api/subscribers/export?pageId=${pageId}`, icon: <Mail size={14} />, label: 'Exportar emails (CSV)' },
    { href: `/dashboard/validate/${pageId}`, icon: <Ticket size={14} />, label: 'Validar entradas' },
    { href: `/dashboard/loyalty/${pageId}`, icon: <Award size={14} />, label: 'Tarjeta de sellos' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Más acciones"
        style={{ padding: '8px 10px', borderRadius: 10, background: '#F6F6F5', color: MUTED, border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', right: 0, marginBottom: 6, minWidth: 200, zIndex: 10,
          background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, boxShadow: '0 8px 24px rgba(26,27,28,0.12)', padding: 6,
        }}>
          {items.map(item => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, color: INK, textDecoration: 'none' }}>
              <span style={{ color: MUTED, flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
