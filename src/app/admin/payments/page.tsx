import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PAGE_SIZE, STATUSES, PROVIDER_IDS, parseFilters, toQuery } from '@/lib/payments/history'
import { PROVIDER_BY_ID } from '@/lib/payments/meta'
import { EVENT_LABELS } from '@/lib/payments/events'
import { formatDate } from '@/lib/utils'
import type { PaymentProvider } from '@/types'

export const metadata = { title: 'Cobros | Admin' }
export const dynamic = 'force-dynamic'
const card = { border: '1px solid rgba(26,27,28,0.08)' }
const ST: Record<string, [string, string, string]> = { approved: ['Aprobado', '#ECFDF3', '#15803D'], pending: ['Pendiente', '#FFF7ED', '#9A3412'], rejected: ['Rechazado', '#FEF0EF', '#B91C1C'], refunded: ['Devuelto', '#F2F3F4', '#5A5D60'] }
const daysAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString()
const money = (n: number, c: string) => { try { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: c }).format(n) } catch { return `${n} ${c}` } }

export default async function AdminPayments({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = parseFilters(await searchParams)
  const admin = createAdminClient()
  const since = daysAgo(30)

  let q = admin.from('payments').select('id, created_at, status, provider, amount, currency, tier_name, payer_email, page_id', { count: 'exact' }).order('created_at', { ascending: false }).range((f.p - 1) * PAGE_SIZE, f.p * PAGE_SIZE - 1)
  if (f.status) q = q.eq('status', f.status as 'approved' | 'pending' | 'rejected' | 'refunded')
  if (f.provider) q = q.eq('provider', f.provider)
  if (f.q) q = q.or(`payer_email.ilike.%${f.q}%,provider_payment_id.ilike.%${f.q}%`)
  const [{ data: rows, count }, { data: recent }, events] = await Promise.all([
    q,
    admin.from('payments').select('status, provider, amount, currency').gte('created_at', since).limit(5000),
    admin.from('payment_events' as never).select('id, payment_id, provider, type, level, message, created_at').in('level' as never, ['warn', 'error'] as never).order('created_at' as never, { ascending: false }).limit(30),
  ])
  const pageIds = [...new Set((rows ?? []).map(r => r.page_id))]
  const { data: pages } = pageIds.length ? await admin.from('pages').select('id, name, user_id').in('id', pageIds) : { data: [] }
  const pageMap = new Map((pages ?? []).map(p => [p.id, p]))
  const ok = (recent ?? []).filter(r => r.status === 'approved'), bad = (recent ?? []).filter(r => r.status === 'rejected')
  const byProvider = PROVIDER_IDS.map(id => ({ id, n: ok.filter(r => r.provider === id).length }))
  const sums = new Map<string, number>(); for (const r of ok) sums.set(r.currency, (sums.get(r.currency) ?? 0) + Number(r.amount))
  const failRate = (recent ?? []).length ? Math.round((bad.length / (recent ?? []).length) * 100) : 0
  const evs = (events.error ? [] : events.data ?? []) as unknown as { id: number; payment_id: string | null; provider: string | null; type: string; level: string; message: string | null; created_at: string }[]
  const total = count ?? 0, pagesN = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const input = 'px-3 py-2 rounded-xl text-[13px] bg-white outline-none'; const ring = { border: '1.5px solid rgba(26,27,28,0.12)' }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1180px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Cobros de la plataforma</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-5">Todos los pagos de todos los clientes y los eventos con problemas. Los clientes ven solo los suyos.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[['Aprobados 30d', String(ok.length)], ['Rechazados 30d', String(bad.length)], ['Tasa de rechazo', `${failRate}%`], ['Volumen aprobado', [...sums].map(([c, n]) => money(n, c)).join(' · ') || '—']].map(([k, v]) => (
          <div key={k} className="bg-white rounded-2xl p-4" style={card}><p className="text-xs text-[#6B6E71]">{k}</p><p className="text-[20px] font-bold text-[#1A1B1C] mt-1 break-words">{v}</p></div>
        ))}
      </div>
      <p className="text-xs text-[#6B6E71] mb-5">Aprobados por pasarela (30 días): {byProvider.map(p => `${PROVIDER_BY_ID[p.id].name.split(' (')[0]} ${p.n}`).join(' · ')}</p>

      <form method="GET" className="flex flex-wrap gap-2 mb-4" role="search">
        <input name="q" defaultValue={f.q} placeholder="Email o ID de pago" aria-label="Buscar" className={`${input} min-w-[200px] flex-1`} style={ring} />
        <select name="status" defaultValue={f.status ?? ''} aria-label="Estado" className={input} style={ring}><option value="">Todos los estados</option>{STATUSES.map(s => <option key={s} value={s}>{ST[s][0]}</option>)}</select>
        <select name="provider" defaultValue={f.provider ?? ''} aria-label="Pasarela" className={input} style={ring}><option value="">Todas las pasarelas</option>{PROVIDER_IDS.map(p => <option key={p} value={p}>{PROVIDER_BY_ID[p].name.split(' (')[0]}</option>)}</select>
        <button className="h-[38px] px-5 rounded-xl text-[13px] font-semibold text-white" style={{ background: '#1A1B1C' }}>Filtrar</button>
      </form>

      <div className="bg-white rounded-2xl overflow-x-auto mb-3" style={card}>
        <table className="w-full text-[13px] min-w-[720px]"><thead><tr className="text-left text-xs text-[#6B6E71] border-b" style={{ borderColor: 'rgba(26,27,28,0.08)' }}><th className="font-medium px-5 py-3">Fecha</th><th className="font-medium py-3">Cliente / página</th><th className="font-medium py-3">Comprador</th><th className="font-medium py-3">Pasarela</th><th className="font-medium py-3 text-right">Importe</th><th className="font-medium px-5 py-3 text-right">Estado</th></tr></thead>
          <tbody>{(rows ?? []).map(r => { const [l, bg, c] = ST[r.status] ?? [r.status, '#F2F3F4', '#5A5D60']; return (
            <tr key={r.id} className="border-t" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
              <td className="px-5 py-3 text-[#5A5D60] whitespace-nowrap">{formatDate(r.created_at)}</td>
              <td className="py-3">{pageMap.get(r.page_id)?.name ?? '—'}{pageMap.get(r.page_id) && <Link href={`/admin/users/${pageMap.get(r.page_id)!.user_id}`} className="block text-xs underline text-[#6B6E71]">ver cliente</Link>}</td>
              <td className="py-3 text-[#5A5D60]">{r.payer_email ?? '—'}</td>
              <td className="py-3">{PROVIDER_BY_ID[r.provider as PaymentProvider]?.name.split(' (')[0] ?? r.provider}</td>
              <td className="py-3 text-right tabular-nums font-semibold">{money(Number(r.amount), r.currency)}</td>
              <td className="px-5 py-3 text-right"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color: c }}>{l}</span></td>
            </tr>) })}
            {(rows ?? []).length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-[#6B6E71]">Sin resultados.</td></tr>}</tbody></table>
      </div>
      {pagesN > 1 && <nav className="flex justify-between text-[13px] mb-8" aria-label="Paginación">{f.p > 1 ? <Link href={`/admin/payments${toQuery(f, { p: String(f.p - 1) })}`} className="font-semibold no-underline">← Anterior</Link> : <span />}<span className="text-[#6B6E71]">Página {f.p} de {pagesN}</span>{f.p < pagesN ? <Link href={`/admin/payments${toQuery(f, { p: String(f.p + 1) })}`} className="font-semibold no-underline">Siguiente →</Link> : <span />}</nav>}

      <h2 className="text-[16px] font-bold text-[#1A1B1C] mb-3 mt-6">Avisos y errores recientes</h2>
      {evs.length === 0 ? <p className="bg-white rounded-2xl p-5 text-sm text-[#5A5D60]" style={card}>Sin avisos. {events.error && 'El registro de eventos todavía no existe: aplicá la migración 015.'}</p> : (
        <ul className="bg-white rounded-2xl divide-y" style={card}>{evs.map(e => (
          <li key={e.id} className="px-5 py-3 text-[13px] flex gap-3 border-b last:border-0" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
            <span className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.level === 'error' ? '#B91C1C' : '#B45309' }} aria-hidden />
            <span className="min-w-0"><b className="text-[#1A1B1C]">{EVENT_LABELS[e.type] ?? e.type}</b> <span className="text-[#6B6E71]">· {e.provider ?? '—'} · {formatDate(e.created_at)}</span>{e.message && <span className="block text-xs text-[#5A5D60]">{e.message}</span>}</span>
          </li>))}</ul>)}
    </div>
  )
}
