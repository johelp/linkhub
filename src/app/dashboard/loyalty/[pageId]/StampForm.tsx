'use client'
import { useState, useRef } from 'react'
import { Check, X, ScanLine, Gift } from 'lucide-react'

interface Result {
  ok: boolean
  message: string
  detail?: string
}

export function StampForm({ pageId }: { pageId: string }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState<'stamp' | 'redeem' | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function call(action: 'stamp' | 'redeem') {
    if (!code.trim() || loading) return
    setLoading(action)
    setResult(null)
    try {
      const res = await fetch(`/api/loyalty/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, code }),
      })
      const data = await res.json()
      if (res.ok && action === 'stamp') {
        setResult({ ok: true, message: 'Sello sumado ✓', detail: `${data.stamps_count} sellos en total` })
      } else if (res.ok && action === 'redeem') {
        setResult({ ok: true, message: 'Premio canjeado ✓', detail: 'La tarjeta vuelve a empezar en 0' })
      } else if (res.status === 400) {
        setResult({ ok: false, message: 'Todavía no llega a los sellos necesarios' })
      } else if (res.status === 404) {
        setResult({ ok: false, message: 'Código no encontrado' })
      } else {
        setResult({ ok: false, message: 'No se pudo procesar, probá de nuevo' })
      }
    } catch {
      setResult({ ok: false, message: 'Error de conexión' })
    } finally {
      setLoading(null)
      inputRef.current?.focus()
    }
  }

  return (
    <div>
      <form onSubmit={e => { e.preventDefault(); call('stamp') }} style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef} autoFocus value={code} onChange={e => setCode(e.target.value)}
          placeholder="Escaneá o escribí el código de la tarjeta"
          style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: '1.5px solid rgba(26,27,28,0.12)', fontSize: 15, outline: 'none', fontFamily: 'monospace' }}
        />
        <button type="submit" disabled={!!loading || !code.trim()}
          style={{ padding: '0 20px', borderRadius: 12, border: 'none', background: '#E8150A', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ScanLine size={16} /> Sumar sello
        </button>
      </form>
      <button type="button" onClick={() => call('redeem')} disabled={!!loading || !code.trim()}
        style={{ marginTop: 8, width: '100%', padding: '12px 0', borderRadius: 12, border: '1.5px solid rgba(26,27,28,0.12)', background: '#fff', color: '#1A1B1C', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Gift size={15} /> Canjear premio y reiniciar
      </button>
      <p style={{ fontSize: 12, color: '#9A9D9F', marginTop: 8 }}>
        Funciona con cualquier lector de QR externo (apuntá el código de la tarjeta, el texto que lee lo pegás acá) o tipeando el código a mano.
      </p>

      {result && (
        <div style={{
          marginTop: 20, padding: '16px 18px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12,
          background: result.ok ? '#ECFDF5' : '#FEF0EF', color: result.ok ? '#16A34A' : '#E8150A',
        }}>
          {result.ok ? <Check size={22} /> : <X size={22} />}
          <div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>{result.message}</p>
            {result.detail && <p style={{ fontSize: 12, opacity: 0.85 }}>{result.detail}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
