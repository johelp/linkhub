'use client'
import { useState, useRef } from 'react'
import { Check, X, ScanLine } from 'lucide-react'

interface Result {
  ok: boolean
  message: string
  detail?: string
}

export function ValidateForm({ pageId }: { pageId: string }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, code }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, message: 'Entrada válida ✓', detail: data.tier_name })
      } else if (res.status === 409) {
        setResult({ ok: false, message: 'Ya fue usada', detail: data.tier_name })
      } else {
        setResult({ ok: false, message: 'Código no encontrado' })
      }
    } catch {
      setResult({ ok: false, message: 'Error de conexión' })
    } finally {
      setLoading(false)
      setCode('')
      inputRef.current?.focus()
    }
  }

  return (
    <div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef} autoFocus value={code} onChange={e => setCode(e.target.value)}
          placeholder="Escaneá o escribí el código"
          style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: '1.5px solid rgba(26,27,28,0.12)', fontSize: 15, outline: 'none', fontFamily: 'monospace' }}
        />
        <button type="submit" disabled={loading || !code.trim()}
          style={{ padding: '0 20px', borderRadius: 12, border: 'none', background: '#E8150A', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ScanLine size={16} /> Validar
        </button>
      </form>
      <p style={{ fontSize: 12, color: '#9A9D9F', marginTop: 8 }}>
        Funciona con cualquier lector de QR externo (apuntá el código del ticket, el texto que lee lo pegás acá) o tipeando el código a mano.
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
