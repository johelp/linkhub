'use client'
import { useEffect, useRef, useState } from 'react'
import { CalendarCheck } from 'lucide-react'

const INK = '#111314'
const MUTED = '#5B6064'

// The everyday scene LinkHub removes: the same three questions, again and again.
// Bubbles arrive one by one when the section scrolls into view; with reduced
// motion (or no JS) the whole conversation is simply visible.
const MESSAGES: { from: 'client' | 'you'; text: string }[] = [
  { from: 'client', text: 'Hola, ¿cuánto cuesta la primera consulta?' },
  { from: 'you', text: 'Hola. 60 €, dura una hora.' },
  { from: 'client', text: '¿Y tienes hueco el jueves por la tarde?' },
  { from: 'you', text: 'Mírame en mi página y elige la hora que mejor te venga.' },
]

export function Story() {
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setPlay(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPlay(true); io.disconnect() } }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`story ${play ? 'play' : ''}`} style={{ width: 'min(100%, 420px)', margin: '0 auto' }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: 18, boxShadow: '0 1px 2px rgba(17,19,20,.06), 0 40px 70px -30px rgba(17,19,20,.28)', border: '1px solid rgba(17,19,20,.06)' }}>
        <p style={{ margin: '2px 0 14px', fontSize: 12, fontWeight: 600, color: MUTED, letterSpacing: '.04em' }}>WHATSAPP · UN MARTES CUALQUIERA</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {MESSAGES.map((m, i) => (
            <div key={i} className="story-b" style={{ ['--d' as string]: 0.25 + i * 0.9, justifySelf: m.from === 'you' ? 'end' : 'start', maxWidth: '82%', padding: '10px 14px', borderRadius: 16, fontSize: 14.5, lineHeight: 1.4,
              background: m.from === 'you' ? '#DCF8C6' : '#F1F2F2', color: INK, borderBottomRightRadius: m.from === 'you' ? 4 : 16, borderBottomLeftRadius: m.from === 'client' ? 4 : 16 }}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="story-b" style={{ ['--d' as string]: 0.25 + MESSAGES.length * 0.9, marginTop: 16, borderRadius: 18, padding: 16, background: INK, color: '#fff' }}>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Tu página responde por ti</p>
          <p style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 700 }}>Primera consulta · 60 min · 60 €</p>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 12px', background: 'rgba(255,255,255,.12)', fontSize: 14 }}>
            <CalendarCheck size={16} aria-hidden /> Jueves 17:30 · libre
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 13, opacity: 0.8 }}>La solicitud llega a tu WhatsApp, ya ordenada.</p>
        </div>
      </div>
    </div>
  )
}
