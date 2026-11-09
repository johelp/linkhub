'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function SuspendButton({ userId, suspended, email }: { userId: string; suspended: boolean; email: string }) {
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  async function toggle() {
    const next = !suspended
    if (!window.confirm(next ? `¿Suspender a ${email}? No podrá iniciar sesión y sus páginas se despublican.` : `¿Reactivar a ${email}? Podrá volver a entrar (sus páginas quedan despublicadas hasta que las publique).`)) return
    setBusy(true)
    const res = await fetch('/api/admin/suspend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, suspended: next }) })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { toast.error(d.error ?? 'No se pudo cambiar'); return }
    toast.success(next ? 'Cuenta suspendida' : 'Cuenta reactivada'); router.refresh()
  }
  return <button onClick={toggle} disabled={busy} className="h-10 px-4 rounded-xl text-[13px] font-semibold disabled:opacity-60" style={suspended ? { background: '#1A1B1C', color: '#fff' } : { background: '#FEF0EF', color: '#B91C1C' }}>{busy ? '…' : suspended ? 'Reactivar cuenta' : 'Suspender cuenta'}</button>
}
