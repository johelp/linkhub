import Link from 'next/link'
import type { ReactNode } from 'react'

export const LEGAL_UPDATED = '6 de noviembre de 2026'

// Shared frame for the legal pages. The texts are working drafts: they must be
// reviewed by a lawyer for each launch market before they are relied on.
export function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={{ background: '#FAFAF8', minHeight: '100vh', color: '#1A1B1C' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 18, color: '#1A1B1C', textDecoration: 'none' }}>Link<span style={{ color: '#E8150A' }}>Hub</span></Link>
        <h1 style={{ fontSize: 30, lineHeight: 1.2, margin: '28px 0 6px', letterSpacing: '-0.02em' }}>{title}</h1>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: '#5A5D60' }}>Última actualización: {LEGAL_UPDATED}</p>
        <div className="legal-body" style={{ fontSize: 15.5, lineHeight: 1.7, color: '#3F4346' }}>{children}</div>
        <nav aria-label="Documentos legales" style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(26,27,28,.1)', display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14 }}>
          <Link href="/legal/privacidad">Privacidad</Link>
          <Link href="/legal/terminos">Términos</Link>
          <Link href="/legal/cookies">Cookies</Link>
        </nav>
      </div>
    </main>
  )
}

export const H2 = ({ children }: { children: ReactNode }) => <h2 style={{ fontSize: 19, margin: '28px 0 8px', color: '#1A1B1C' }}>{children}</h2>
export const P = ({ children }: { children: ReactNode }) => <p style={{ margin: '0 0 12px' }}>{children}</p>
