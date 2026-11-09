import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PROVIDER_BY_ID } from '@/lib/payments/meta'
import { EVENT_LABELS } from '@/lib/payments/events'
import type { PaymentProvider } from '@/types'

export const metadata: Metadata = { title: 'Detalle del cobro | LinkHub' }
const card = { border: '1px solid rgba(26,27,28,0.08)' }
const fmt = (d: string) => new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(d))
const LEVEL: Record<string, string> = { info: '#185FA5', warn: '#B45309', error: '#B91C1C' }

export default async function PaymentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // RLS: only payments of the caller's pages come back.
  const { data: p } = await supabase.from('payments').select('*').eq('id', id).maybeSingle()
  if (!p) notFound()
  const [{ data: page }, { data: events }, { data: ticket }] = await Promise.all([
    supabase.from('pages').select('name, slug').eq('id', p.page_id).maybeSingle(),
    supabase.from('payment_events').select('id, type, level, message, detail, created_at').eq('payment_id', id).order('created_at', { ascending: true }),
    supabase.from('tickets').select('code, status, used_at').eq('payment_id', id).maybeSingle(),
  ])
  const provider = PROVIDER_BY_ID[p.provider as PaymentProvider]?.name ?? p.provider
  const rows: [string, React.ReactNode][] = [
    ['Estado', p.status], ['Importe', new Intl.NumberFormat('es-AR', { style: 'currency', currency: p.currency }).format(Number(p.amount))],
    ['Pasarela', provider], ['Página', page ? <Link key="p" href={`/editor/${p.page_id}`} className="underline">{page.name}</Link> : '—'], ['Concepto', p.tier_name ?? 'Pago'],
    ['Comprador', p.payer_email ?? '—'], ['ID en la pasarela', p.provider_payment_id ?? '—'], ['Referencia / orden', p.provider_preference_id ?? '—'],
    ['Creado', fmt(p.created_at)], ['Última actualización', fmt(p.updated_at)], ['ID interno', p.id],
    ...(ticket ? [['Entrada', `${ticket.code} · ${ticket.status === 'used' ? 'usada' : ticket.status === 'cancelled' ? 'cancelada' : 'sin usar'}`] as [string, string]] : []),
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[860px] mx-auto">
      <Link href="/dashboard/payments/history" className="inline-flex items-center gap-1.5 text-sm text-[#5A5D60] no-underline mb-3"><ArrowLeft size={14} />Historial</Link>
      <h1 className="text-[22px] lg:text-[26px] font-bold tracking-tight text-[#1A1B1C] mb-5">Detalle del cobro</h1>
      <dl className="bg-white rounded-2xl divide-y mb-6" style={{ ...card, '--tw-divide-opacity': 1 } as React.CSSProperties}>
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[150px_1fr] gap-3 px-5 py-3 text-[13px]" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
            <dt className="text-[#6B6E71]">{k}</dt><dd className="text-[#1A1B1C] font-medium break-all">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="text-[16px] font-bold text-[#1A1B1C] mb-3">Registro de eventos</h2>
      {(events ?? []).length === 0 ? (
        <p className="bg-white rounded-2xl p-5 text-sm text-[#5A5D60]" style={card}>No hay eventos registrados para este cobro (los pagos anteriores a la activación del registro no los tienen).</p>
      ) : (
        <ol className="bg-white rounded-2xl p-5 space-y-4" style={card}>
          {events!.map(e => (
            <li key={e.id} className="flex gap-3">
              <span className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: LEVEL[e.level] ?? '#185FA5' }} aria-hidden />
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-[#1A1B1C]">{EVENT_LABELS[e.type] ?? e.type}{e.level !== 'info' && <span className="ml-2 text-[10.5px] font-bold uppercase" style={{ color: LEVEL[e.level] }}>{e.level === 'error' ? 'error' : 'aviso'}</span>}</p>
                <p className="text-xs text-[#6B6E71]">{fmt(e.created_at)}{e.message ? ` · ${e.message}` : ''}</p>
                {e.detail && Object.keys(e.detail as object).length > 0 && <pre className="mt-1.5 text-[11px] bg-[#F6F6F5] rounded-lg p-2 overflow-x-auto text-[#3A3D40]">{JSON.stringify(e.detail, null, 2)}</pre>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
