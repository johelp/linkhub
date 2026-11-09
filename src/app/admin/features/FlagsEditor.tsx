'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

interface Flag { key: string; label: string; description: string; codeDefault: boolean; enabled_default: boolean; rollout_percent: number; note: string; overrides: { user_id: string; enabled: boolean; email: string }[] }
const card = { border: '1px solid rgba(26,27,28,0.08)' }

export function FlagsEditor({ flags }: { flags: Flag[] }) {
  return <div className="space-y-4">{flags.map(f => <FlagCard key={f.key} flag={f} />)}</div>
}

function FlagCard({ flag }: { flag: Flag }) {
  const router = useRouter()
  const [all, setAll] = useState(flag.enabled_default)
  const [pct, setPct] = useState(flag.rollout_percent)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const dirty = all !== flag.enabled_default || pct !== flag.rollout_percent

  async function call(url: string, body: unknown, ok: string) {
    setBusy(true)
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { toast.error(data.error ?? 'No se pudo guardar'); return false }
    toast.success(ok); router.refresh(); return true
  }

  const state = all ? 'Todos los clientes' : pct > 0 ? `${pct}% de los clientes` : flag.overrides.some(o => o.enabled) ? 'Solo clientes elegidos' : 'Apagada'
  return (
    <section className="bg-white rounded-2xl p-5" style={card} aria-labelledby={`f-${flag.key}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`f-${flag.key}`} className="text-[16px] font-bold text-[#1A1B1C]">{flag.label}</h2>
          <p className="text-[13px] text-[#5A5D60]">{flag.description} <code className="text-[11px] bg-[#F2F3F4] px-1.5 py-0.5 rounded">{flag.key}</code></p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: all ? '#ECFDF3' : pct > 0 || flag.overrides.length ? '#FFF7ED' : '#F2F3F4', color: all ? '#15803D' : pct > 0 || flag.overrides.length ? '#9A3412' : '#5A5D60' }}>{state}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <label className="flex items-center justify-between gap-3 rounded-xl p-3.5 cursor-pointer" style={{ border: '1.5px solid rgba(26,27,28,0.1)' }}>
          <span><span className="block text-[14px] font-semibold text-[#1A1B1C]">Activada para todos</span><span className="block text-xs text-[#6B6E71]">Disponibilidad general</span></span>
          <input type="checkbox" role="switch" checked={all} onChange={e => setAll(e.target.checked)} className="w-5 h-5" />
        </label>
        <label className="rounded-xl p-3.5 block" style={{ border: '1.5px solid rgba(26,27,28,0.1)', opacity: all ? 0.5 : 1 }}>
          <span className="flex justify-between text-[14px] font-semibold text-[#1A1B1C]">Despliegue gradual <span className="tabular-nums">{pct}%</span></span>
          <input type="range" min={0} max={100} step={5} value={pct} disabled={all} onChange={e => setPct(Number(e.target.value))} className="w-full mt-2" aria-label={`Porcentaje de clientes para ${flag.label}`} />
          <span className="block text-xs text-[#6B6E71] mt-1">Siempre los mismos clientes; subir el % suma más sin sacar a nadie.</span>
        </label>
      </div>
      {dirty && <button disabled={busy} onClick={() => call('/api/admin/flags', { key: flag.key, enabled_default: all, rollout_percent: pct }, 'Guardado')} className="mt-3 h-10 px-5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60" style={{ background: '#E8150A' }}>Guardar cambios</button>}

      <div className="mt-5">
        <h3 className="text-[13px] font-bold text-[#1A1B1C] mb-2">Clientes puntuales (piloto)</h3>
        <form className="flex flex-wrap gap-2 mb-3" onSubmit={async e => { e.preventDefault(); if (await call('/api/admin/flags/override', { key: flag.key, email, enabled: true }, 'Activada para ese cliente')) setEmail('') }}>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email del cliente" aria-label="Email del cliente" className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl text-[13px] outline-none" style={{ border: '1.5px solid rgba(26,27,28,0.14)' }} />
          <button disabled={busy} className="h-10 px-4 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60" style={{ background: '#1A1B1C' }}>Activar para este cliente</button>
        </form>
        {flag.overrides.length === 0 ? <p className="text-xs text-[#6B6E71]">Ningún cliente elegido todavía.</p> : (
          <ul className="flex flex-wrap gap-2">
            {flag.overrides.map(o => (
              <li key={o.user_id} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-[12.5px] font-medium" style={{ background: o.enabled ? '#ECFDF3' : '#FEF0EF', color: o.enabled ? '#15803D' : '#B91C1C' }}>
                {o.enabled ? '✓' : '✕'} {o.email}
                <button aria-label={`Quitar ${o.email}`} onClick={() => call('/api/admin/flags/override', { key: flag.key, email: o.email, enabled: null }, 'Quitado')} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10"><X size={12} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
