import { createAdminClient } from '@/lib/supabase/admin'
import { appEnv } from '@/lib/env'
import { FLAG_KEYS } from '@/lib/flags'

export const metadata = { title: 'Sistema | Admin' }
export const dynamic = 'force-dynamic'
const card = { border: '1px solid rgba(26,27,28,0.08)' }

// Presence only: NEVER print a value of a secret.
const ENV: { name: string; need: 'required' | 'recommended' | 'optional'; what: string }[] = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', need: 'required', what: 'Base de datos y login' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', need: 'required', what: 'Clave pública de Supabase' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', need: 'required', what: 'Operaciones del servidor (admin, webhooks)' },
  { name: 'NEXT_PUBLIC_APP_URL', need: 'required', what: 'URL pública (enlaces, QR, retornos de pago)' },
  { name: 'NEXT_PUBLIC_APP_ENV', need: 'required', what: 'production / staging' },
  { name: 'ADMIN_EMAILS', need: 'required', what: 'Quién entra a /admin' },
  { name: 'TOKEN_ENCRYPTION_KEY', need: 'recommended', what: 'Cifrado de claves de cobro de clientes' },
  { name: 'STRIPE_SECRET_KEY', need: 'required', what: 'Suscripciones Pro (Stripe)' },
  { name: 'STRIPE_WEBHOOK_SECRET', need: 'required', what: 'Webhook de suscripciones' },
  { name: 'STRIPE_PRICE_ID_PRO', need: 'required', what: 'Precio del plan Pro' },
  { name: 'STRIPE_CONNECT_CLIENT_ID', need: 'optional', what: 'Cobros de clientes con Stripe' },
  { name: 'STRIPE_CONNECT_WEBHOOK_SECRET', need: 'optional', what: 'Webhook de Stripe Connect' },
  { name: 'MERCADOPAGO_CLIENT_ID', need: 'optional', what: 'Cobros de clientes con Mercado Pago' },
  { name: 'MERCADOPAGO_CLIENT_SECRET', need: 'optional', what: 'Mercado Pago (OAuth)' },
  { name: 'MERCADOPAGO_WEBHOOK_SECRET', need: 'optional', what: 'Webhook de Mercado Pago' },
  { name: 'RESEND_API_KEY', need: 'recommended', what: 'Email de entradas' },
]

async function probe(admin: ReturnType<typeof createAdminClient>, table: string, col = '*') {
  const { error } = await admin.from(table as never).select(col, { head: true, count: 'estimated' }).limit(1)
  return !error
}

export default async function SystemPage() {
  const admin = createAdminClient()
  const [db, m011, m013a, m013b, m014, m015, m016, m017, m018, m019, m020] = await Promise.all([
    probe(admin, 'profiles', 'id'), probe(admin, 'pages', 'moderated_at'), probe(admin, 'processed_webhook_events', 'id'), probe(admin, 'admin_audit_log', 'id'),
    probe(admin, 'payment_connections', 'config'), probe(admin, 'payment_events', 'id'), probe(admin, 'feature_flags', 'key'),
    probe(admin, 'profiles', 'billing_lapsed_at'), probe(admin, 'api_keys', 'id'), probe(admin, 'knowledge_entries', 'id'), probe(admin, 'roadmap_votes', 'item_key'),
  ])
  const rpc = await admin.rpc('owner_daily_stats' as never, { days: 1 } as never)
  const migrations = [
    ['011 · Endurecimiento (RLS, imágenes)', null], ['012 · Estadísticas del dashboard', !rpc.error ? true : rpc.error.message.includes('auth') || rpc.error.code === 'PGRST202' ? false : true],
    ['013 · Idempotencia, auditoría, moderación', m013a && m013b && m011], ['014 · Cobros multi-pasarela', m014], ['015 · Registro de eventos de pago', m015], ['016 · Funciones por cliente', m016],
    ['017 · Periodo de gracia por impago', m017], ['018 · Claves de API', m018], ['019 · Base de conocimiento', m019], ['020 · Votos de Próximamente', m020],
  ] as [string, boolean | null][]
  const items = ENV.map(e => ({ ...e, set: !!process.env[e.name] }))
  const missingReq = items.filter(i => i.need === 'required' && !i.set).length

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[980px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Sistema</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-5">Estado de la plataforma y qué falta configurar. Solo se muestra si cada ajuste existe, nunca su valor.</p>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {[['Entorno', appEnv()], ['Base de datos', db ? 'Conectada' : 'Sin conexión'], ['Variables obligatorias', missingReq ? `${missingReq} faltan` : 'Completas']].map(([k, v]) => (
          <div key={k} className="bg-white rounded-2xl p-4" style={card}><p className="text-xs text-[#6B6E71]">{k}</p><p className="text-[18px] font-bold mt-1" style={{ color: v.includes('falta') || v.includes('Sin') ? '#B91C1C' : '#1A1B1C' }}>{v}</p></div>
        ))}
      </div>

      <h2 className="text-[16px] font-bold text-[#1A1B1C] mb-3">Migraciones de base de datos</h2>
      <ul className="bg-white rounded-2xl mb-6" style={card}>{migrations.map(([n, ok]) => (
        <li key={n} className="flex items-center justify-between gap-3 px-5 py-3 border-b last:border-0 text-[13px]" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
          <span>{n}</span><span className="font-bold text-xs px-2.5 py-1 rounded-full" style={{ background: ok === null ? '#F2F3F4' : ok ? '#ECFDF3' : '#FEF0EF', color: ok === null ? '#5A5D60' : ok ? '#15803D' : '#B91C1C' }}>{ok === null ? 'no verificable' : ok ? 'aplicada' : 'pendiente'}</span></li>))}</ul>

      <h2 className="text-[16px] font-bold text-[#1A1B1C] mb-3">Variables de entorno</h2>
      <ul className="bg-white rounded-2xl mb-6" style={card}>{items.map(i => (
        <li key={i.name} className="flex items-center justify-between gap-3 px-5 py-2.5 border-b last:border-0 text-[13px]" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
          <span className="min-w-0"><code className="text-[12px]">{i.name}</code><span className="block text-xs text-[#6B6E71]">{i.what}</span></span>
          <span className="font-bold text-xs px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: i.set ? '#ECFDF3' : i.need === 'required' ? '#FEF0EF' : '#F2F3F4', color: i.set ? '#15803D' : i.need === 'required' ? '#B91C1C' : '#5A5D60' }}>{i.set ? 'definida' : i.need === 'required' ? 'FALTA' : i.need === 'recommended' ? 'recomendada' : 'opcional'}</span></li>))}</ul>
      <p className="text-xs text-[#6B6E71]">{FLAG_KEYS.length} funciones gestionables en <a href="/admin/features" className="underline">Funciones</a>. Monitoreo externo: apuntá tu servicio de uptime a <code>/api/health</code>.</p>
    </div>
  )
}
