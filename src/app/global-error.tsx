'use client'

// Renders when the root layout itself fails, so it must bring its own <html>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#FAFAF8', color: '#1A1B1C', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>Estamos teniendo un problema</h1>
          <p style={{ margin: '0 0 20px', color: '#5A5D60', lineHeight: 1.6 }}>Vuelve a intentarlo en unos segundos.</p>
          <button type="button" onClick={reset} style={{ minHeight: 44, padding: '0 22px', borderRadius: 999, border: 'none', background: '#1A1B1C', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Reintentar</button>
          {error.digest && <p style={{ marginTop: 18, fontSize: 12, color: '#6B6E71' }}>Código de referencia: {error.digest}</p>}
        </div>
      </body>
    </html>
  )
}
