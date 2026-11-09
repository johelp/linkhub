'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Check, Copy, Loader2 } from 'lucide-react'
import type { DnsRecord } from '@/lib/domains'

export interface PageOption { id: string; name: string; slug: string }
export interface DomainRow { id: string; page_id: string; domain: string; status: 'pending' | 'verified' | 'active'; last_error: string | null; records: DnsRecord[] }

const BORDER = '1px solid rgba(26,27,28,0.08)'

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" aria-label={`Copiar ${label}`} onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500) } catch { toast.error('No se pudo copiar') } }}
      className="inline-flex items-center justify-center rounded-lg hover:bg-[#F2F3F4]" style={{ width: 36, height: 36, color: '#5A5D60' }}>
      {done ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
    </button>
  )
}

const STATUS: Record<DomainRow['status'], { label: string; bg: string; fg: string; text: string }> = {
  pending: { label: 'Pendiente de DNS', bg: '#FFF7ED', fg: '#9A3412', text: 'Crea estos registros en el panel de tu proveedor de dominio y pulsa «Comprobar ahora». Los cambios pueden tardar unos minutos.' },
  verified: { label: 'Verificado · activándose', bg: '#EFF6FF', fg: '#1D4ED8', text: 'Hemos comprobado que el dominio es tuyo. Lo estamos activando: suele tardar hasta un día laborable. Mantén los registros tal cual.' },
  active: { label: 'Activo', bg: '#F0FDF4', fg: '#15803D', text: 'Tu página ya se muestra en este dominio.' },
}

export function DomainManager({ pages, domains }: { pages: PageOption[]; domains: DomainRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [input, setInput] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function call(key: string, url: string, init: RequestInit) {
    setBusy(key)
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init })
      const json = await res.json().catch(() => ({}))
      return { res, json }
    } finally { setBusy(null) }
  }

  async function add(pageId: string) {
    const { res, json } = await call(`add:${pageId}`, '/api/domains', { method: 'POST', body: JSON.stringify({ pageId, domain: input[pageId] ?? '' }) })
    if (!res.ok) { setErrors(e => ({ ...e, [pageId]: json.error || 'No se pudo añadir el dominio.' })); return }
    setErrors(e => ({ ...e, [pageId]: '' })); setInput(i => ({ ...i, [pageId]: '' })); router.refresh()
  }
  async function verify(d: DomainRow) {
    const { res, json } = await call(`v:${d.id}`, '/api/domains/verify', { method: 'POST', body: JSON.stringify({ id: d.id }) })
    if (!res.ok) { toast.error(json.error || 'No se pudo comprobar'); return }
    if (json.ok) toast.success('¡Dominio verificado!'); else toast.error(json.error || 'Todavía no lo vemos')
    router.refresh()
  }
  async function remove(d: DomainRow) {
    if (!window.confirm(`¿Quitar ${d.domain}? Tu página dejará de mostrarse en ese dominio.`)) return
    const { res } = await call(`r:${d.id}`, `/api/domains?id=${encodeURIComponent(d.id)}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('No se pudo quitar'); return }
    router.refresh()
  }

  if (pages.length === 0) return <p className="text-sm text-[#5A5D60]">Primero crea una página.</p>

  return (
    <div className="grid gap-4">
      {pages.map(p => {
        const d = domains.find(x => x.page_id === p.id)
        return (
          <section key={p.id} className="rounded-2xl bg-white p-5" style={{ border: BORDER }} aria-label={`Dominio de ${p.name}`}>
            <h2 className="text-[16px] font-bold text-[#1A1B1C]">{p.name}</h2>
            {!d ? (
              <form className="mt-3" onSubmit={e => { e.preventDefault(); add(p.id) }}>
                <label htmlFor={`d-${p.id}`} className="block text-[13px] font-semibold text-[#1A1B1C] mb-1.5">Tu dominio</label>
                <div className="flex gap-2">
                  <input id={`d-${p.id}`} value={input[p.id] ?? ''} onChange={e => setInput(i => ({ ...i, [p.id]: e.target.value }))} placeholder="www.tunegocio.com" autoCapitalize="none" spellCheck={false}
                    className="flex-1 min-w-0 rounded-xl px-4 text-[15px] outline-none" style={{ height: 48, border: '1.5px solid rgba(26,27,28,0.12)' }} />
                  <button type="submit" disabled={busy === `add:${p.id}` || !(input[p.id] ?? '').trim()} className="rounded-xl px-5 text-[14px] font-semibold text-white" style={{ height: 48, background: '#1A1B1C', opacity: (input[p.id] ?? '').trim() ? 1 : 0.6 }}>
                    {busy === `add:${p.id}` ? <Loader2 size={16} className="animate-spin" aria-hidden /> : 'Añadir'}
                  </button>
                </div>
                <p className="text-[12.5px] text-[#5A5D60] mt-2">Recomendado: un subdominio como <b>www.tunegocio.com</b> o <b>reservas.tunegocio.com</b> (es el más sencillo de configurar).</p>
                {errors[p.id] && <p role="alert" className="text-[13px] mt-2" style={{ color: '#B50F07' }}>{errors[p.id]}</p>}
              </form>
            ) : (
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-[#1A1B1C]">{d.domain}</span>
                  <span className="text-[12px] font-bold rounded-full px-2.5 py-1" style={{ background: STATUS[d.status].bg, color: STATUS[d.status].fg }}>{STATUS[d.status].label}</span>
                </div>
                <p className="text-[13.5px] text-[#5A5D60] mt-2">{STATUS[d.status].text}</p>
                {d.status === 'active' && <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-[14px] underline text-[#1A1B1C]">Abrir {d.domain}</a>}

                {d.status !== 'active' && (
                  <div className="mt-4 overflow-x-auto rounded-xl" style={{ border: BORDER }}>
                    <table className="w-full text-left text-[13px] min-w-[560px]">
                      <caption className="sr-only">Registros DNS que debes crear</caption>
                      <thead><tr className="bg-[#F6F6F4]"><th className="px-3 py-2 font-semibold">Tipo</th><th className="px-3 py-2 font-semibold">Nombre / host</th><th className="px-3 py-2 font-semibold">Valor</th><th className="px-3 py-2"><span className="sr-only">Copiar</span></th></tr></thead>
                      <tbody>
                        {d.records.map(r => (
                          <tr key={r.purpose} style={{ borderTop: BORDER }}>
                            <td className="px-3 py-2 font-bold">{r.type}</td>
                            <td className="px-3 py-2"><code>{r.name}</code> <CopyBtn text={r.name} label="nombre" /></td>
                            <td className="px-3 py-2 break-all"><code>{r.value}</code> <CopyBtn text={r.value} label="valor" /></td>
                            <td className="px-3 py-2 text-[#5A5D60]">{r.purpose === 'verify' ? 'Demuestra que eres el dueño' : 'Apunta el dominio a LinkHub'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {d.status === 'pending' && d.last_error && <p role="status" className="text-[13px] mt-3 text-[#9A3412]">{d.last_error}</p>}
                {d.status !== 'active' && <p className="text-[12.5px] text-[#5A5D60] mt-3">Si usas Cloudflare, deja la nube en gris («Solo DNS») en el registro de apuntado.</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {d.status === 'pending' && (
                    <button type="button" onClick={() => verify(d)} disabled={busy === `v:${d.id}`} className="rounded-xl px-5 text-[14px] font-semibold text-white inline-flex items-center gap-2" style={{ height: 44, background: '#E8150A' }}>
                      {busy === `v:${d.id}` && <Loader2 size={15} className="animate-spin" aria-hidden />} Comprobar ahora
                    </button>
                  )}
                  <button type="button" onClick={() => remove(d)} className="rounded-xl px-5 text-[14px] font-semibold" style={{ height: 44, border: '1.5px solid rgba(26,27,28,0.15)', color: '#1A1B1C', background: '#fff' }}>Quitar dominio</button>
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
