'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export interface AdminDomainRow { id: string; domain: string; status: 'pending' | 'verified' | 'active'; pageName: string; owner: string; created_at: string }
const LABEL = { pending: 'Pendiente de DNS', verified: 'Verificado: falta activar', active: 'Activo' } as const

export function DomainsTable({ rows }: { rows: AdminDomainRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  async function act(id: string, action: 'activate' | 'deactivate') {
    setBusy(id)
    const res = await fetch('/api/admin/domains', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) })
    setBusy(null)
    if (!res.ok) { toast.error((await res.json().catch(() => ({}))).error || 'Error'); return }
    router.refresh()
  }
  if (rows.length === 0) return <p className="text-sm text-[#5A5D60]">Aún no hay dominios.</p>
  return (
    <ul className="bg-white rounded-2xl" style={{ listStyle: 'none', padding: 0, margin: 0, border: '1px solid rgba(26,27,28,0.08)' }}>
      {rows.map((r, i) => (
        <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3" style={{ borderTop: i ? '1px solid rgba(26,27,28,0.06)' : 'none' }}>
          <div className="flex-1 min-w-[220px]">
            <p className="text-[14px] font-semibold text-[#1A1B1C]">{r.domain}</p>
            <p className="text-[12.5px] text-[#5A5D60]">{r.pageName} · {r.owner}</p>
          </div>
          <span className="text-[12px] font-bold rounded-full px-2.5 py-1" style={{ background: r.status === 'active' ? '#F0FDF4' : r.status === 'verified' ? '#EFF6FF' : '#FFF7ED', color: r.status === 'active' ? '#15803D' : r.status === 'verified' ? '#1D4ED8' : '#9A3412' }}>{LABEL[r.status]}</span>
          {r.status === 'verified' && <button type="button" disabled={busy === r.id} onClick={() => act(r.id, 'activate')} className="rounded-xl px-4 text-[13px] font-semibold text-white" style={{ height: 40, background: '#1A1B1C' }}>Activar</button>}
          {r.status === 'active' && <button type="button" disabled={busy === r.id} onClick={() => act(r.id, 'deactivate')} className="rounded-xl px-4 text-[13px] font-semibold" style={{ height: 40, border: '1.5px solid rgba(26,27,28,0.15)', background: '#fff' }}>Desactivar</button>}
        </li>
      ))}
    </ul>
  )
}
