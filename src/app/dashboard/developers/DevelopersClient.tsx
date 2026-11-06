'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, KeyRound, Trash2 } from 'lucide-react'
import { SCOPES, SCOPE_LABEL, type Scope } from '@/lib/mcp/scopes'

export interface KeyView {
  id: string; name: string; prefix: string; scopes: string[]; lastUsed: string; expires: string | null
  expired: boolean; revoked: boolean; created: string
}

const card = { border: '1px solid rgba(26,27,28,0.08)' }
const field = { border: '1.5px solid rgba(26,27,28,0.12)' }
const EXPIRY = [{ days: 0, label: 'Sin caducidad' }, { days: 30, label: '30 días' }, { days: 90, label: '90 días' }, { days: 365, label: '1 año' }]

export function DevelopersClient({ keys }: { keys: KeyView[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<Scope[]>(['pages:read'])
  const [days, setDays] = useState(90)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState('')
  const secretRef = useRef<HTMLDivElement>(null)

  const toggle = (s: Scope) => setScopes(cur => (cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]))

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setNotice(''); setSecret(null); setCopied(false)
    if (!scopes.length) { setError('Elige al menos un permiso'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, scopes, expiresAt: days ? new Date(Date.now() + days * 864e5).toISOString() : null }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setError(j.error || 'No se pudo crear la clave'); return }
      setSecret(j.key); setName('')
      router.refresh()
      setTimeout(() => secretRef.current?.focus(), 50)
    } catch { setError('Error de red. Inténtalo de nuevo.') } finally { setBusy(false) }
  }

  async function copy() {
    if (!secret) return
    try { await navigator.clipboard.writeText(secret); setCopied(true) } catch { setError('No se pudo copiar: selecciona la clave y cópiala a mano') }
  }

  async function revoke(k: KeyView) {
    if (!window.confirm(`¿Revocar la clave "${k.name}"? Las integraciones que la usen dejarán de funcionar de inmediato.`)) return
    setError(''); setNotice('')
    const res = await fetch(`/api/developer/keys?id=${encodeURIComponent(k.id)}`, { method: 'DELETE' })
    if (!res.ok) { setError('No se pudo revocar'); return }
    setNotice(`Clave "${k.name}" revocada.`)
    router.refresh()
  }

  return (
    <>
      <section aria-labelledby="nueva" className="bg-white rounded-2xl p-5" style={card}>
        <h2 id="nueva" className="text-[15px] font-bold text-[#1A1B1C] mb-3 flex items-center gap-2"><KeyRound size={16} aria-hidden />Crear una API key</h2>
        <form onSubmit={create} className="grid gap-4">
          <div>
            <label htmlFor="kname" className="block text-[13px] font-semibold text-[#1A1B1C] mb-1">Nombre</label>
            <input id="kname" value={name} onChange={e => setName(e.target.value)} maxLength={60} required placeholder="Ej.: Chatbot de la web"
              className="w-full px-3 py-2.5 rounded-xl text-[14px] bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#1A1B1C]" style={field} />
          </div>
          <fieldset>
            <legend className="text-[13px] font-semibold text-[#1A1B1C] mb-1">Permisos</legend>
            <p className="text-[12.5px] text-[#5A5D60] mb-2">Da solo los necesarios. Una clave con permisos de lectura no puede modificar nada.</p>
            <div className="grid sm:grid-cols-2 gap-1.5">
              {SCOPES.map(s => (
                <label key={s} className="flex items-start gap-2.5 min-h-[44px] px-3 py-2 rounded-xl cursor-pointer hover:bg-[#F6F6F5]" style={field}>
                  <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggle(s)} className="mt-1 w-4 h-4" />
                  <span className="text-[13px] leading-tight"><span className="block font-semibold text-[#1A1B1C]">{SCOPE_LABEL[s]}</span><code className="text-[11.5px] text-[#5A5D60]">{s}</code></span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="kexp" className="block text-[13px] font-semibold text-[#1A1B1C] mb-1">Caducidad</label>
            <select id="kexp" value={days} onChange={e => setDays(Number(e.target.value))} className="px-3 py-2.5 rounded-xl text-[14px] bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#1A1B1C]" style={field}>
              {EXPIRY.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="h-11 px-5 rounded-xl text-[14px] font-semibold text-white disabled:opacity-60" style={{ background: '#1A1B1C' }}>{busy ? 'Creando…' : 'Crear clave'}</button>
            <span role="alert" className="text-[13px] font-medium text-[#B91C1C]">{error}</span>
          </div>
        </form>

        {secret && (
          <div ref={secretRef} tabIndex={-1} role="status" className="mt-5 rounded-xl p-4 outline-none" style={{ background: '#FFF7ED', border: '1px solid #FDBA74' }}>
            <p className="text-[14px] font-bold text-[#9A3412]">Copia tu clave ahora: no volverá a mostrarse</p>
            <p className="text-[12.5px] text-[#9A3412] mt-0.5">Guárdala en un gestor de contraseñas o en las variables secretas de tu servidor. No la pongas en una web ni en un repositorio.</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <code className="flex-1 min-w-0 break-all px-3 py-2 rounded-lg bg-white text-[13px] select-all" style={{ border: '1px solid #FDBA74' }}>{secret}</code>
              <button type="button" onClick={copy} className="h-10 px-4 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: '#1A1B1C' }}>
                {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}{copied ? 'Copiada' : 'Copiar'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="claves" className="bg-white rounded-2xl p-5 mt-5" style={card}>
        <h2 id="claves" className="text-[15px] font-bold text-[#1A1B1C] mb-1">Tus claves</h2>
        <p role="status" className="text-[13px] text-[#15803D] min-h-[1.2em]">{notice}</p>
        {keys.length === 0 ? <p className="text-[13px] text-[#5A5D60]">Aún no has creado ninguna clave.</p> : (
          <ul className="grid gap-2">
            {keys.map(k => {
              const dead = k.revoked || k.expired
              return (
                <li key={k.id} className="rounded-xl p-3.5 flex flex-wrap items-start justify-between gap-3" style={{ ...field, opacity: dead ? 0.65 : 1 }}>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1A1B1C]">{k.name} {k.revoked ? <Tag text="Revocada" /> : k.expired ? <Tag text="Caducada" /> : null}</p>
                    <p className="text-[12.5px] text-[#5A5D60] mt-0.5"><code>{k.prefix}…</code> · creada {k.created} · último uso {k.lastUsed}{k.expires ? ` · caduca ${k.expires}` : ' · sin caducidad'}</p>
                    <p className="text-[12px] text-[#5A5D60] mt-1 break-words">{k.scopes.join(' · ')}</p>
                  </div>
                  {!dead && (
                    <button type="button" onClick={() => revoke(k)} className="h-10 px-3.5 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 text-[#B91C1C] hover:bg-[#FEF0EF]" style={{ border: '1px solid #FCA5A5' }}>
                      <Trash2 size={14} aria-hidden />Revocar<span className="sr-only"> {k.name}</span>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}

function Tag({ text }: { text: string }) {
  return <span className="ml-1.5 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: '#F2F3F4', color: '#5A5D60' }}>{text}</span>
}
