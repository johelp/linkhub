'use client'
import Link from 'next/link'
import { useEffect } from 'react'

export default function EditorError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F6F5' }}>
      <div style={{ textAlign: 'center', maxWidth: 360, padding: '0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1B1C', marginBottom: 8 }}>Error al cargar el editor</h2>
        <p style={{ fontSize: 13, color: '#9A9D9F', marginBottom: 24 }}>{error.message || 'Algo salió mal.'}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={reset}
            style={{ padding: '10px 20px', borderRadius: 10, background: '#E8150A', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Reintentar
          </button>
          <Link href="/dashboard"
            style={{ padding: '10px 20px', borderRadius: 10, background: '#F2F3F4', color: '#1A1B1C', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Volver
          </Link>
        </div>
      </div>
    </div>
  )
}
