import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, Check, Lock } from 'lucide-react'
import { PLAN_LIMITS, type Plan } from '@/types'
import { loadDashboardStats, lastNDays, seriesFor, sum, delta } from '@/lib/dashboardStats'
import { NewPageButton } from './NewPageButton'
import { getFlagsForUser } from '@/lib/flags.server'
import { PagesGrid, type PageRow } from './PagesGrid'
import { Sparkline } from './charts'

export const metadata = { title: 'Resumen | LinkHub' }

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(0)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: profile }, { data: pages }] = await Promise.all([
    supabase.from('profiles').select('plan, full_name').eq('id', user.id).single(),
    supabase.from('pages_summary').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ])
  const plan = (profile?.plan || 'free') as Plan
  const limits = PLAN_LIMITS[plan]
  const aiEnabled = user ? (await getFlagsForUser(user.id, user.email)).ai_onboarding : false
  const list = (pages || []).filter(p => p.id)
  const ids = list.map(p => p.id!)
  const fullAnalytics = limits.analytics !== 'basic'

  const [stats, subs] = await Promise.all([
    loadDashboardStats(supabase, ids, 60),
    ids.length
      ? supabase.from('email_subscribers').select('id', { count: 'exact', head: true }).in('page_id', ids)
      : Promise.resolve({ count: 0 }),
  ])

  const days = lastNDays(60)
  const cur = days.slice(30)
  const viewsAll = seriesFor(stats.daily, days, 'views')
  const clicksAll = seriesFor(stats.daily, days, 'clicks')
  const views30 = sum(viewsAll.slice(30)), clicks30 = sum(clicksAll.slice(30))
  const viewsDelta = delta(views30, sum(viewsAll.slice(0, 30)))
  const clicksDelta = delta(clicks30, sum(clicksAll.slice(0, 30)))
  const ctr = views30 ? Math.round((clicks30 / views30) * 1000) / 10 : 0
  const contacts = subs.count ?? 0

  const rows: PageRow[] = list.map(p => ({
    id: p.id!, name: p.name ?? 'Sin nombre', slug: p.slug ?? '', published: !!p.published, color: p.primary_color || '#E8150A',
    blocks: p.block_count ?? 0,
    views30: sum(seriesFor(stats.daily, cur, 'views', p.id!)),
    clicks30: sum(seriesFor(stats.daily, cur, 'clicks', p.id!)),
    updated: p.updated_at ?? '',
  }))

  const first = list[0]
  const steps = [
    { done: list.length > 0, label: 'Crear tu primera página', href: null as string | null, cta: 'Crear' },
    { done: list.some(p => (p.block_count ?? 0) >= 3), label: 'Agregar al menos 3 bloques', href: first ? `/editor/${first.id}` : null, cta: 'Abrir editor' },
    { done: list.some(p => p.published), label: 'Publicar tu página', href: first ? `/editor/${first.id}` : null, cta: 'Publicar' },
    { done: sum(viewsAll) > 0, label: 'Compartir tu enlace o QR y recibir tu primera visita', href: first ? `/dashboard/qr/${first.id}` : null, cta: 'Ver QR' },
  ]
  const doneCount = steps.filter(s => s.done).length
  const nextStep = steps.find(s => !s.done)
  const canCreate = list.length < limits.pages
  const hello = (profile?.full_name || user.email || '').split(/[ @]/)[0]

  const planCard = (
<section className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(26,27,28,0.08)' }} aria-labelledby="plan-h">
            <h2 id="plan-h" className="text-[15px] font-bold text-[#1A1B1C] mb-3">Tu plan: <span style={{ color: plan === 'pro' ? '#E8150A' : '#5A5D60' }}>{plan === 'pro' ? 'Pro' : 'Free'}</span></h2>
            <p className="text-xs text-[#5B6064] mb-1.5">Páginas usadas</p>
            <div className="h-1.5 rounded-full bg-[#F2F3F4] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min((list.length / Math.min(limits.pages, 10)) * 100, 100)}%`, background: '#1A1B1C' }} /></div>
            <p className="text-xs text-[#6B6E71] mt-1.5">{list.length} de {plan === 'pro' ? 'ilimitadas' : limits.pages}</p>
            {plan !== 'pro' && (
              <Link href="/dashboard/upgrade" className="mt-4 flex items-center justify-center h-10 rounded-xl text-[13px] font-semibold no-underline" style={{ background: '#FEF0EF', color: '#C8110A' }}>Ver el plan Pro</Link>
            )}
          </section>
  )

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1180px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Hola{hello ? `, ${hello}` : ''} 👋</h1>
          <p className="text-sm text-[#5B6064] mt-1">Así viene tu actividad en los últimos 30 días.</p>
        </div>
        <NewPageButton canCreate={canCreate} plan={plan} aiEnabled={aiEnabled} />
      </header>

      {/* KPIs */}
      <section aria-label="Métricas" className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <Kpi label="Visitas" value={fmt(views30)} delta={viewsDelta} spark={viewsAll.slice(30)} color="#E8150A" />
        <Kpi label="Clics en tus enlaces" value={fullAnalytics ? fmt(clicks30) : '—'} delta={fullAnalytics ? clicksDelta : null} spark={fullAnalytics ? clicksAll.slice(30) : []} color="#185FA5" locked={!fullAnalytics} />
        <Kpi label="Tasa de clic" value={fullAnalytics ? `${ctr}%` : '—'} hint="clics sobre visitas" spark={[]} color="#7C3AED" locked={!fullAnalytics} />
        <Kpi label="Contactos" value={fmt(contacts)} hint="emails capturados" spark={[]} color="#16A34A" href="/dashboard/contacts" />
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="min-w-0 order-2 xl:order-1">
          {rows.length === 0 ? <EmptyState canCreate={canCreate} plan={plan} aiEnabled={aiEnabled} /> : <PagesGrid pages={rows} canCreate={canCreate} plan={plan} showClicks={fullAnalytics} aiEnabled={aiEnabled} />}
          <div className="xl:hidden mt-6">{planCard}</div>
          {stats.approximate && rows.length > 0 && (
            <p className="text-xs text-[#6B6E71] mt-5">Las métricas son una muestra reciente. Aplicá la migración <code>012_dashboard_stats.sql</code> para ver el total exacto.</p>
          )}
        </div>

        <aside className="space-y-4 order-1 xl:order-2 xl:sticky xl:top-6">
          {doneCount < steps.length && (
            <section className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(26,27,28,0.08)' }} aria-labelledby="steps-h">
              <div className="flex items-center justify-between mb-1">
                <h2 id="steps-h" className="text-[15px] font-bold text-[#1A1B1C]">Primeros pasos</h2>
                <span className="text-xs font-semibold text-[#6B6E71]">{doneCount}/{steps.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F2F3F4] my-3 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(doneCount / steps.length) * 100}%`, background: 'linear-gradient(90deg,#E8150A,#FF8C00)' }} /></div>
              <ol className="space-y-2.5">
                {steps.map(s => (
                  <li key={s.label} className="flex items-start gap-2.5 text-[13px]" style={{ color: s.done ? '#6B6E71' : '#1A1B1C' }}>
                    <span className="mt-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: s.done ? '#16A34A' : '#fff', border: s.done ? 'none' : '1.5px solid rgba(26,27,28,0.2)' }}>
                      {s.done && <Check size={11} color="#fff" strokeWidth={3} />}
                    </span>
                    <span className={s.done ? 'line-through' : ''}>{s.label}</span>
                  </li>
                ))}
              </ol>
              {nextStep?.href && (
                <Link href={nextStep.href} className="mt-4 flex items-center justify-center h-10 rounded-xl text-[13px] font-semibold text-white no-underline" style={{ background: '#1A1B1C' }}>{nextStep.cta} →</Link>
              )}
            </section>
          )}

          <div className="hidden xl:block">{planCard}</div>
        </aside>
      </div>
    </div>
  )
}

function Kpi({ label, value, delta: d, spark, color, hint, locked, href }: {
  label: string; value: string; delta?: number | null; spark: number[]; color: string; hint?: string; locked?: boolean; href?: string
}) {
  const body = (
    <div className="bg-white rounded-2xl p-4 lg:p-5 h-full" style={{ border: '1px solid rgba(26,27,28,0.08)' }}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-medium text-[#5B6064]">{label}</p>
        {locked && <Link href="/dashboard/upgrade" className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full no-underline" style={{ background: '#FEF0EF', color: '#C8110A' }}><Lock size={9} />PRO</Link>}
      </div>
      <p className="text-[28px] font-bold tracking-tight text-[#1A1B1C] tabular-nums mt-1 leading-none">{value}</p>
      <div className="flex items-center gap-2 mt-2 min-h-[18px]">
        {d != null && (
          <span className="flex items-center text-xs font-semibold" style={{ color: d >= 0 ? '#15803D' : '#B91C1C' }}>
            {d >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(d)}%
          </span>
        )}
        <span className="text-[11.5px] text-[#6B6E71]">{d != null ? 'vs. 30 días previos' : hint ?? ''}</span>
      </div>
      {spark.length > 1 && <div className="mt-2"><Sparkline values={spark} color={color} /></div>}
    </div>
  )
  return href ? <Link href={href} className="no-underline block">{body}</Link> : body
}

function EmptyState({ canCreate, plan, aiEnabled }: { canCreate: boolean; plan: Plan; aiEnabled: boolean }) {
  return (
    <div className="bg-white rounded-3xl text-center px-6 py-14" style={{ border: '1px dashed rgba(26,27,28,0.18)' }}>
      <div className="text-5xl mb-4">🚀</div>
      <h2 className="text-xl font-bold text-[#1A1B1C] mb-2">Creá tu primera página</h2>
      <p className="text-sm text-[#5B6064] max-w-sm mx-auto mb-6">Elegí una plantilla (catálogo, citas, pedidos…) o empezá en blanco. Queda lista en minutos.</p>
      {canCreate && <div className="inline-block"><NewPageButton canCreate plan={plan} aiEnabled={aiEnabled} /></div>}
    </div>
  )
}
