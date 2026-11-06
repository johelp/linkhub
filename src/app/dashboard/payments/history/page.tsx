import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Download, ArrowLeft, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PROVIDER_BY_ID } from '@/lib/payments/meta'
import { PAGE_SIZE, STATUSES, PROVIDER_IDS, parseFilters, toQuery } from '@/lib/payments/history'
import { formatDate } from '@/lib/utils'
import type { PaymentProvider } from '@/types'

export const metadata: Metadata = { title: 'Historial de cobros | LinkHub' }

interface Props { searchParams: Promise<Record<string, string | string[] | undefined>> }

const STATUS_UI: Record<string, [string, string, string]> = { approved: ['Aprobado', '#ECFDF3', '#15803D'], pending: ['Pendiente', '#FFF7ED', '#9A3412'], rejected: ['Rechazado', '#FEF0EF', '#B91C1C'], refunded: ['Devuelto', '#F2F3F4', '#5A5D60'] }
const card = { border: '1px solid rgba(26,27,28,0.08)' }
const money = (n: number, c: string) => { try { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: c }).format(n) } catch { return `${n} ${c}` } }

export default async function HistoryPage({ searchParams }: Props) {
  const f = parseFilters(await searchParams)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: pages } = await supabase.from('pages').select('id, name').eq('user_id', user.id)
  const pageName = new Map((pages ?? []).map(p => [p.id, p.name]))

  let q = supabase.from('payments')
    .select('id, created_at, status, provider, amount, currency, tier_name, payer_email, provider_payment_id, page_id', { count: 'exact' })
    .in('page_id', [...pageName.keys()].length ? [...pageName.keys()] : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .range((f.p - 1) * PAGE_SIZE, f.p * PAGE_SIZE - 1)
  if (f.status) q = q.eq('status', f.status as 'approved' | 'pending' | 'rejected' | 'refunded')
  if (f.provider) q = q.eq('provider', f.provider)
  if (f.page) q = q.eq('page_id', f.page)
  if (f.from) q = q.gte('created_at', `${f.from}T00:00:00Z`)
  if (f.to) q = q.lte('created_at', `${f.to}T23:59:59Z`)
  if (f.q) q = q.or(`payer_email.ilike.%${f.q}%,provider_payment_id.ilike.%${f.q}%,tier_name.ilike.%${f.q}%`)
  const { data: rows, count } = await q
  const total = count ?? 0
  const pagesCount = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  // Totals of what's approved in the current filter, per currency.
  const approved = new Map<string, number>()
  for (const r of rows ?? []) if (r.status === 'approved') approved.set(r.currency, (approved.get(r.currency) ?? 0) + Number(r.amount))

  const input = 'px-3 py-2 rounded-xl text-[13px] bg-white outline-none'
  const ring = { border: '1.5px solid rgba(26,27,28,0.12)' }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1100px] mx-auto">
      <Link href="/dashboard/payments" className="inline-flex items-center gap-1.5 text-sm text-[#5A5D60] no-underline mb-3"><ArrowLeft size={14} />Cobros</Link>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Historial de cobros</h1>
          <p className="text-sm text-[#5A5D60] mt-1">Todos los pagos de tus páginas, con el detalle de cada paso.</p>
        </div>
        <a href={`/api/payments/export${toQuery(f, { p: undefined })}`} className="flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold no-underline text-white" style={{ background: '#1A1B1C' }}><Download size={14} />Exportar CSV</a>
      </div>

      <form method="GET" className="bg-white rounded-2xl p-4 mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6" style={card} role="search" aria-label="Filtrar cobros">
        <label className="relative lg:col-span-2"><span className="sr-only">Buscar</span><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6E71]" />
          <input name="q" defaultValue={f.q} placeholder="Email, concepto o ID de pago" className={`${input} w-full pl-8`} style={ring} /></label>
        <select name="status" defaultValue={f.status ?? ''} aria-label="Estado" className={input} style={ring}><option value="">Todos los estados</option>{STATUSES.map(s => <option key={s} value={s}>{STATUS_UI[s][0]}</option>)}</select>
        <select name="provider" defaultValue={f.provider ?? ''} aria-label="Pasarela" className={input} style={ring}><option value="">Todas las pasarelas</option>{PROVIDER_IDS.map(p => <option key={p} value={p}>{PROVIDER_BY_ID[p].name.split(' (')[0]}</option>)}</select>
        <select name="page" defaultValue={f.page ?? ''} aria-label="Página" className={input} style={ring}><option value="">Todas las páginas</option>{(pages ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <div className="flex gap-2"><button className="flex-1 h-[38px] rounded-xl text-[13px] font-semibold text-white" style={{ background: '#E8150A' }}>Filtrar</button>
          {(f.q || f.status || f.provider || f.page || f.from || f.to) && <Link href="/dashboard/payments/history" className="h-[38px] px-3 rounded-xl text-[13px] font-semibold no-underline flex items-center" style={{ background: '#F2F3F4', color: '#3A3D40' }}>Limpiar</Link>}</div>
        <label className="text-xs text-[#5A5D60] flex items-center gap-2 sm:col-span-1 lg:col-span-3">Desde<input type="date" name="from" defaultValue={f.from} className={input} style={ring} /></label>
        <label className="text-xs text-[#5A5D60] flex items-center gap-2 sm:col-span-1 lg:col-span-3">Hasta<input type="date" name="to" defaultValue={f.to} className={input} style={ring} /></label>
      </form>

      <p className="text-[13px] text-[#5A5D60] mb-3" aria-live="polite">
        {total} {total === 1 ? 'cobro' : 'cobros'}{approved.size > 0 && <> · aprobados en esta página: <b className="text-[#1A1B1C]">{[...approved].map(([c, n]) => money(n, c)).join(' · ')}</b></>}
      </p>

      {(rows ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl px-6 py-14 text-center text-sm text-[#5A5D60]" style={card}>No hay cobros que coincidan. Cuando alguien pague en tus páginas lo vas a ver acá.</div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={card}>
          <table className="w-full text-[13px]">
            <thead className="hidden md:table-header-group"><tr className="text-left text-xs text-[#6B6E71] border-b" style={{ borderColor: 'rgba(26,27,28,0.08)' }}>
              <th className="font-medium px-5 py-3">Fecha</th><th className="font-medium py-3">Concepto</th><th className="font-medium py-3">Pasarela</th><th className="font-medium py-3 text-right">Importe</th><th className="font-medium px-5 py-3 text-right">Estado</th></tr></thead>
            <tbody>
              {rows!.map(r => {
                const [label, bg, color] = STATUS_UI[r.status] ?? [r.status, '#F2F3F4', '#5A5D60']
                return (
                  <tr key={r.id} className="border-t hover:bg-[#FAFAFA] block md:table-row px-5 py-3 md:p-0" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
                    <td className="md:px-5 md:py-3.5 block md:table-cell text-[#5A5D60] whitespace-nowrap">{formatDate(r.created_at)}</td>
                    <td className="md:py-3.5 block md:table-cell"><Link href={`/dashboard/payments/history/${r.id}`} className="font-semibold text-[#1A1B1C] no-underline hover:underline">{r.tier_name ?? 'Pago'}</Link>
                      <span className="block text-xs text-[#6B6E71] truncate max-w-[280px]">{r.payer_email ?? 'Comprador'} · {pageName.get(r.page_id) ?? 'Página'}</span></td>
                    <td className="md:py-3.5 hidden md:table-cell text-[#3A3D40]">{PROVIDER_BY_ID[r.provider as PaymentProvider]?.name.split(' (')[0] ?? r.provider}</td>
                    <td className="md:py-3.5 block md:table-cell md:text-right tabular-nums font-semibold">{money(Number(r.amount), r.currency)}</td>
                    <td className="md:px-5 md:py-3.5 block md:table-cell md:text-right"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagesCount > 1 && (
        <nav className="flex items-center justify-between mt-4 text-[13px]" aria-label="Paginación">
          {f.p > 1 ? <Link href={`/dashboard/payments/history${toQuery(f, { p: String(f.p - 1) })}`} className="font-semibold no-underline text-[#1A1B1C]">← Anterior</Link> : <span />}
          <span className="text-[#6B6E71]">Página {f.p} de {pagesCount}</span>
          {f.p < pagesCount ? <Link href={`/dashboard/payments/history${toQuery(f, { p: String(f.p + 1) })}`} className="font-semibold no-underline text-[#1A1B1C]">Siguiente →</Link> : <span />}
        </nav>
      )}
    </div>
  )
}
