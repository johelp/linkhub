'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

// Set by Endorsely's tracking script (see layout.tsx) when it's configured
// and this visitor arrived through an affiliate link. Undefined the rest of
// the time, in which case referralId below is just omitted from the request.
declare global {
  interface Window { endorsely_referral?: string }
}

interface Props {
  isPro: boolean
  paymentsConfigured: boolean
}

export function UpgradeButton({ isPro, paymentsConfigured }: Props) {
  const [loading, setLoading] = useState(false)

  async function go(endpoint: '/api/checkout' | '/api/billing-portal') {
    setLoading(true)
    try {
      const referralId = endpoint === '/api/checkout' ? window.endorsely_referral : undefined
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Error')
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Algo salió mal')
      setLoading(false)
    }
  }

  if (!paymentsConfigured) {
    return (
      <button disabled className="w-full py-3 rounded-xl text-sm font-bold text-white opacity-60 cursor-not-allowed" style={{ background: '#E8150A' }}>
        Próximamente · Stripe
      </button>
    )
  }

  if (isPro) {
    return (
      <button onClick={() => go('/api/billing-portal')} disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60"
        style={{ background: '#F2F3F4', color: '#1A1B1C' }}>
        {loading ? 'Abriendo...' : 'Gestionar suscripción'}
      </button>
    )
  }

  return (
    <button onClick={() => go('/api/checkout')} disabled={loading}
      className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
      style={{ background: '#E8150A' }}>
      {loading ? 'Redirigiendo...' : 'Empezar Pro →'}
    </button>
  )
}
