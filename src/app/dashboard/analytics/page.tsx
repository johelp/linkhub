import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { PLAN_LIMITS, type Plan, type Block } from '@/types'
import { loadDashboardStats, lastNDays, seriesFor, sum, delta } from '@/lib/dashboardStats'
import { summarizeBlock } from '@/lib/blocks/summary'
import { AreaChart, Bar } from '../charts'

export const metadata = { title: 'Analíticas | LinkHub' }

interface Props { searchParams: Promise<{ page?: string; range?: string }> }

const DEVICE_LABEL: Record<string, string> = { mobile: 'Móvil', tablet: 'Tablet', desktop: 'Escritorio' }
const card = { border: '1px solid rgba(26,27,28,0.08)' }

export default async function AnalyticsPage({ searchParams }: Props) {
  const { page: pageParam, range } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: profile }, { data: pages }] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
    supabase.from('pages').select('id, name, slug, blocks').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ])
  const plan = (profile?.plan || 'free') as Plan
  const full = PLAN_LIMITS[plan].analytics !== 'basic'
  const list = pages ?? []
  const selected = list.find(p => p.id === pageParam)
  const rangeDays = range === '7' ? 7 : 30

  const stats = await loadDashboardStats(supabase, list.map(p => p.id), rangeDays * 2)
  const days = lastNDays(rangeDays * 2)
  const cur = days.slice(rangeDays)
  const pid = selected?.id
  const views = seriesFor(stats.daily, days, 'views', pid)
  const clicks = seriesFor(stats.daily, days, 'clicks', pid)
  const v = sum(views.slice(rangeDays)), c = sum(clicks.slice(rangeDays))
  const vd = delta(v, sum(views.slice(0, rangeDays))), cd = delta(c, sum(clicks.slice(0, rangeDays)))

  // Block names for the "top blocks" table.
  const blockName = new Map<string, string>()
  for (const p of list) for (const b of (p.blocks as unknown as Block[]) ?? []) blockName.set(`${p.id}|${b.id}`, summarizeBlock(b, 'es').title)
  const top = stats.topBlocks.filter(b => !pid || b.page_id === pid)
  const topMax = Math.max(...top.map(b => b.clicks), 1)
  const devTotal = sum(stats.devices.map(d => d.views)) || 1
  const pageName = new Map(list.map(p => [p.id, p.name]))

  const q = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    const merged = { page: pageParam, range, ...extra }
    for (const [k, val] of Object.entries(merged)) if (val) sp.set(k, val)
    const s = sp.toString()
    return `/dashboard/analytics${s ? `?${s}` : ''}`
  }
  const pill = (on: boolean): React.CSSProperties => ({ background: on ? '#1A1B1C' : '#fff', color: on ? '#fff' : '#5A5D60', border: '1px solid rgba(26,27,28,0.09)' })

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1100px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Analíticas</h1>
      <p className="text-sm text-[#7A7D80] mt-1 mb-5">Qué pasa en tus páginas: visitas, clics y desde dónde te ven.</p>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex gap-1.5 overflow-x-auto pb-1 mr-auto" role="group" aria-label="Página">
          <Link href={q({ page: undefined })} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold no-underline whitespace-nowrap" style={pill(!pid)}>Todas</Link>
          {list.map(p => <Link key={p.id} href={q({ page: p.id })} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold no-underline whitespace-nowrap max-w-[180px] truncate" style={pill(p.id === pid)}>{p.name}</Link>)}
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Período">
          {[['7', '7 días'], ['30', '30 días']].map(([k, l]) => <Link key={k} href={q({ range: k })} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold no-underline" style={pill(String(rangeDays) === k)}>{l}</Link>)}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-sm text-[#7A7D80]" style={card}>Todavía no tenés páginas. Creá una y compartila para empezar a ver datos.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-5">
            <Stat label="Visitas" value={v} delta={vd} />
            <Stat label="Clics" value={full ? c : null} delta={full ? cd : null} />
            <Stat label="Tasa de clic" value={full ? `${v ? Math.round((c / v) * 1000) / 10 : 0}%` : null} />
          </div>

          <section className="bg-white rounded-2xl p-4 lg:p-6 mb-5" style={card} aria-labelledby="chart-h">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 id="chart-h" className="text-[15px] font-bold text-[#1A1B1C]">Evolución · últimos {rangeDays} días</h2>
              <div className="flex gap-4 text-xs text-[#5A5D60]">
                <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: '#E8150A' }} />Visitas</span>
                {full && <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: '#185FA5' }} />Clics</span>}
              </div>
            </div>
            <AreaChart days={cur} series={[{ label: 'Visitas', values: views.slice(rangeDays), color: '#E8150A' }, ...(full ? [{ label: 'Clics', values: clicks.slice(rangeDays), color: '#185FA5' }] : [])]} />
            {v === 0 && <p className="text-center text-sm text-[#9A9D9F] mt-2">Aún no hay visitas en este período. Compartí tu enlace o tu QR.</p>}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="bg-white rounded-2xl p-5 relative" style={card} aria-labelledby="top-h">
              <h2 id="top-h" className="text-[15px] font-bold text-[#1A1B1C] mb-4">Bloques más clicados</h2>
              {!full ? <ProLock text="Descubrí qué enlaces y productos reciben más clics." /> : top.length === 0 ? (
                <p className="text-sm text-[#9A9D9F]">Sin clics todavía.</p>
              ) : (
                <ol className="space-y-3">
                  {top.map(b => (
                    <li key={`${b.page_id}${b.block_id}`}>
                      <div className="flex justify-between gap-3 text-[13px] mb-1">
                        <span className="truncate text-[#1A1B1C] font-medium">{blockName.get(`${b.page_id}|${b.block_id}`) ?? b.block_type ?? 'Bloque'}{!pid && list.length > 1 && <span className="text-[#9A9D9F] font-normal"> · {pageName.get(b.page_id)}</span>}</span>
                        <span className="tabular-nums font-semibold">{b.clicks}</span>
                      </div>
                      <Bar value={b.clicks} max={topMax} color="#185FA5" />
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="bg-white rounded-2xl p-5" style={card} aria-labelledby="dev-h">
              <h2 id="dev-h" className="text-[15px] font-bold text-[#1A1B1C] mb-4">Dispositivos</h2>
              {!full ? <ProLock text="Mirá desde qué dispositivos te visitan." /> : stats.devices.length === 0 ? (
                <p className="text-sm text-[#9A9D9F]">Sin datos todavía.</p>
              ) : (
                <ul className="space-y-3">
                  {stats.devices.sort((a, b) => b.views - a.views).map(d => (
                    <li key={d.device}>
                      <div className="flex justify-between text-[13px] mb-1"><span className="font-medium text-[#1A1B1C]">{DEVICE_LABEL[d.device] ?? d.device}</span><span className="tabular-nums text-[#5A5D60]">{Math.round((d.views / devTotal) * 100)}%</span></div>
                      <Bar value={d.views} max={devTotal} color="#7C3AED" />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {!pid && list.length > 1 && (
            <section className="bg-white rounded-2xl p-5 mt-5 overflow-x-auto" style={card} aria-labelledby="pp-h">
              <h2 id="pp-h" className="text-[15px] font-bold text-[#1A1B1C] mb-3">Por página</h2>
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-[#9A9D9F] text-xs"><th className="font-medium pb-2">Página</th><th className="font-medium pb-2 text-right">Visitas</th><th className="font-medium pb-2 text-right">Clics</th></tr></thead>
                <tbody>
                  {list.map(p => (
                    <tr key={p.id} className="border-t" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
                      <td className="py-2.5"><Link href={q({ page: p.id })} className="text-[#1A1B1C] font-medium no-underline hover:underline">{p.name}</Link></td>
                      <td className="py-2.5 text-right tabular-nums">{sum(seriesFor(stats.daily, cur, 'views', p.id))}</td>
                      <td className="py-2.5 text-right tabular-nums">{full ? sum(seriesFor(stats.daily, cur, 'clicks', p.id)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          {stats.approximate && <p className="text-xs text-[#9A9D9F] mt-5">Mostrando una muestra reciente. Aplicá la migración <code>012_dashboard_stats.sql</code> para ver los totales exactos.</p>}
        </>
      )}
    </div>
  )
}

function Stat({ label, value, delta: d }: { label: string; value: number | string | null; delta?: number | null }) {
  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5" style={card}>
      <p className="text-[12.5px] font-medium text-[#7A7D80]">{label}</p>
      {value === null ? (
        <Link href="/dashboard/upgrade" className="inline-flex items-center gap-1.5 mt-2 text-sm font-bold no-underline" style={{ color: '#E8150A' }}><Lock size={13} />Solo Pro</Link>
      ) : (
        <p className="text-[28px] font-bold tracking-tight text-[#1A1B1C] tabular-nums leading-tight mt-1">{value}</p>
      )}
      {d != null && <span className="flex items-center text-xs font-semibold mt-1" style={{ color: d >= 0 ? '#15803D' : '#B91C1C' }}>{d >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(d)}% vs. período previo</span>}
    </div>
  )
}

function ProLock({ text }: { text: string }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: '#FEF0EF' }}>
      <p className="text-sm text-[#5A5D60] mb-3">{text}</p>
      <Link href="/dashboard/upgrade" className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-full no-underline text-white" style={{ background: '#E8150A' }}><Lock size={12} />Desbloquear con Pro</Link>
    </div>
  )
}
