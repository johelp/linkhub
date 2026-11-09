'use client'
import { useEffect } from 'react'

// Last-resort boundary for any page: friendly message, retry, and the digest so
// support can find the exact server log line. No stack traces for visitors.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#FAFAF8', color: '#1A1B1C', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>Algo no ha salido bien</h1>
        <p style={{ margin: '0 0 20px', color: '#5A5D60', lineHeight: 1.6 }}>Hemos tenido un problema al cargar esta página. Inténtalo de nuevo; si sigue pasando, avísanos.</p>
        <button type="button" onClick={reset} style={{ minHeight: 44, padding: '0 22px', borderRadius: 999, border: 'none', background: '#1A1B1C', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Reintentar</button>
        {error.digest && <p style={{ marginTop: 18, fontSize: 12, color: '#6B6E71' }}>Código de referencia: {error.digest}</p>}
      </div>
    </main>
  )
}
