'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export function MercadoPagoConnect({ connected }: { connected: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function disconnect() {
    setLoading(true)
    try {
      const res = await fetch('/api/connect/mercadopago/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Mercado Pago desconectado')
      router.refresh()
    } catch {
      toast.error('No se pudo desconectar')
    } finally {
      setLoading(false)
    }
  }

  if (connected) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#ECFDF5', color: '#16A34A' }}>
          ● Conectado
        </span>
        <button onClick={disconnect} disabled={loading}
          className="text-xs font-semibold underline disabled:opacity-50" style={{ color: '#9A9D9F' }}>
          {loading ? 'Desconectando...' : 'Desconectar'}
        </button>
      </div>
    )
  }

  return (
    <a href="/api/connect/mercadopago/start"
      className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white"
      style={{ background: '#009EE3' }}>
      Conectar Mercado Pago
    </a>
  )
}
