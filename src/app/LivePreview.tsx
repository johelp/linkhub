'use client'
import { useState } from 'react'
import Link from 'next/link'
import { buildDemoPage } from './demoPage'
import { PageView } from './p/[slug]/PageView'

const R = '#E8150A'
const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const BORDER = 'rgba(26,27,28,0.09)'

export function LivePreview() {
  const [name, setName] = useState('')
  const page = buildDemoPage(name, !!name.trim())

  return (
    <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 8 }}>Probalo con tu negocio</h2>
      <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 28 }}>
        Escribí el nombre de tu negocio y mirá la vista previa — sin registrarte.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <input
          type="text" value={name} maxLength={40}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de tu negocio"
          style={{
            width: '100%', maxWidth: 360, padding: '13px 18px', borderRadius: 25,
            border: `1.5px solid ${BORDER}`, background: '#fff', fontSize: 14, color: INK,
            outline: 'none', textAlign: 'center', fontFamily: 'inherit',
          }}
          onFocus={e => (e.target.style.borderColor = R)}
          onBlur={e => (e.target.style.borderColor = BORDER)}
        />

        <div style={{
          width: 300, borderRadius: 36, border: '10px solid #1A1B1C', background: '#fff',
          overflow: 'hidden', boxShadow: '0 24px 60px rgba(26,27,28,0.16)', maxHeight: 480,
        }}>
          <div style={{ maxHeight: 460, overflow: 'hidden' }}>
            <PageView page={page} />
          </div>
        </div>

        <Link href="/auth" className="hero-cta"
          style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: R, padding: '13px 28px', borderRadius: 25, textDecoration: 'none' }}>
          {name.trim() ? `Crear la página de ${name.trim()} →` : 'Crear mi página gratis →'}
        </Link>
      </div>
    </section>
  )
}
