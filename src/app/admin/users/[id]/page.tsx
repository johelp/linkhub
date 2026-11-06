import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFlagsForUser } from '@/lib/flags.server'
import { FLAGS, FLAG_KEYS } from '@/lib/flags'
import { PlanSelect } from '../PlanSelect'
import { SuspendButton } from './SuspendButton'
import { formatDate } from '@/lib/utils'
import type { Plan } from '@/types'

export const metadata = { title: 'Cliente | Admin' }
export const dynamic = 'force-dynamic'
const card = { border: '1px solid rgba(26,27,28,0.08)' }

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const admin = createAdminClient()
  const { data: p } = await admin.from('profiles').select('id, email, full_name, plan, created_at, stripe_subscription_status').eq('id', id).maybeSingle()
  if (!p) notFound()
  const [{ data: pages }, { data: conns }, { data: au }, { count: payCount }] = await Promise.all([
    admin.from('pages').select('id, name, slug, published, views, moderated_at').eq('user_id', id).order('created_at', { ascending: false }).then(async r => r.error
      // moderated_at arrives with migration 013: degrade gracefully before it's applied
      ? { data: ((await admin.from('pages').select('id, name, slug, published, views').eq('user_id', id)).data ?? []).map(x => ({ ...x, moderated_at: null as string | null })), error: null }
      : r),
    admin.from('payment_connections').select('provider, live_mode, connected_at').eq('user_id', id),
    admin.auth.admin.getUserById(id),
    admin.from('payments').select('id', { count: 'exact', head: true }).in('page_id', (await admin.from('pages').select('id').eq('user_id', id)).data?.map(x => x.id) ?? ['00000000-0000-0000-0000-000000000000']),
  ])
  const flags = await getFlagsForUser(id, p.email)
  const bannedUntil = (au?.user as { banned_until?: string | null } | undefined)?.banned_until
  const suspended = !!bannedUntil && new Date(bannedUntil) > new Date()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[900px] mx-auto">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-[#5A5D60] no-underline mb-3"><ArrowLeft size={14} />Clientes</Link>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div><h1 className="text-[22px] lg:text-[26px] font-bold tracking-tight text-[#1A1B1C] break-all">{p.email}</h1>
          <p className="text-sm text-[#5A5D60]">{p.full_name ?? 'Sin nombre'} · alta {formatDate(p.created_at)}{suspended && <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF0EF', color: '#B91C1C' }}>SUSPENDIDO</span>}</p></div>
        <SuspendButton userId={p.id} suspended={suspended} email={p.email} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <section className="bg-white rounded-2xl p-5" style={card}><h2 className="text-[14px] font-bold mb-3">Plan</h2><PlanSelect userId={p.id} plan={p.plan as Plan} /><p className="text-xs text-[#6B6E71] mt-2">Suscripción Stripe: {p.stripe_subscription_status ?? 'sin suscripción'}</p></section>
        <section className="bg-white rounded-2xl p-5" style={card}><h2 className="text-[14px] font-bold mb-3">Cobros</h2>
          <p className="text-[13px] text-[#3A3D40]">{(conns ?? []).length ? (conns ?? []).map(c => `${c.provider}${c.live_mode ? '' : ' (prueba)'}`).join(', ') : 'Sin pasarelas conectadas'}</p>
          <p className="text-xs text-[#6B6E71] mt-1">{payCount ?? 0} pagos registrados · <Link href="/admin/payments" className="underline">ver cobros</Link></p></section>
      </div>

      <section className="bg-white rounded-2xl p-5 mb-4" style={card}><h2 className="text-[14px] font-bold mb-3">Funciones activas para este cliente</h2>
        <ul className="flex flex-wrap gap-2">{FLAG_KEYS.map(k => <li key={k} className="text-[12.5px] font-medium px-3 py-1 rounded-full" style={{ background: flags[k] ? '#ECFDF3' : '#F2F3F4', color: flags[k] ? '#15803D' : '#5A5D60' }}>{flags[k] ? '✓' : '—'} {FLAGS[k].label}</li>)}</ul>
        <p className="text-xs text-[#6B6E71] mt-2">Se cambian en <Link href="/admin/features" className="underline">Funciones</Link>.</p></section>

      <section className="bg-white rounded-2xl overflow-hidden" style={card}><h2 className="text-[14px] font-bold px-5 pt-5 pb-3">Páginas ({(pages ?? []).length})</h2>
        <ul>{(pages ?? []).map(pg => (
          <li key={pg.id} className="flex items-center justify-between gap-3 px-5 py-3 border-t text-[13px]" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
            <span className="min-w-0"><b className="block truncate">{pg.name}</b><span className="text-xs text-[#6B6E71]">/p/{pg.slug} · {pg.views} vistas</span></span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: pg.moderated_at ? '#FEF0EF' : pg.published ? '#ECFDF3' : '#F2F3F4', color: pg.moderated_at ? '#B91C1C' : pg.published ? '#15803D' : '#5A5D60' }}>{pg.moderated_at ? 'moderada' : pg.published ? 'en vivo' : 'borrador'}</span></li>))}
          {(pages ?? []).length === 0 && <li className="px-5 py-6 text-sm text-[#6B6E71] border-t" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>Sin páginas.</li>}</ul></section>
    </div>
  )
}
