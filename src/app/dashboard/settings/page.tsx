import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MercadoPagoConnect } from './MercadoPagoConnect'

export const metadata: Metadata = { title: 'Ajustes | LinkHub' }

const STATUS_MESSAGES: Record<string, { text: string; color: string }> = {
  connected: { text: '✓ Mercado Pago conectado correctamente.', color: '#16A34A' },
  error: { text: 'No se pudo conectar Mercado Pago. Probá de nuevo.', color: '#E8150A' },
  not_configured: { text: 'Mercado Pago todavía no está configurado en el servidor (faltan las credenciales de la app).', color: '#FF8C00' },
}

interface Props {
  searchParams: Promise<{ mp?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const { mp } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const admin = createAdminClient()
  const { data: connection } = await admin
    .from('payment_connections')
    .select('id, live_mode, connected_at')
    .eq('user_id', user.id)
    .eq('provider', 'mercadopago')
    .single()

  const status = mp ? STATUS_MESSAGES[mp] : null

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/dashboard" className="text-sm" style={{ color: '#9A9D9F' }}>← Dashboard</Link>
      <h1 className="text-2xl font-bold mt-4 mb-2" style={{ color: '#1A1B1C' }}>Ajustes</h1>
      <p className="text-sm mb-8" style={{ color: '#9A9D9F' }}>Conectá los servicios que usan tus bloques.</p>

      {status && (
        <div className="rounded-xl p-3 mb-6 text-sm font-medium" style={{ background: '#F6F6F5', color: status.color }}>
          {status.text}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(26,27,28,0.09)' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold" style={{ color: '#1A1B1C' }}>Mercado Pago</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: '#5A5D60' }}>
          Conectá tu cuenta para usar el bloque &quot;Cobrar (Mercado Pago)&quot; en tus páginas. LinkHub nunca ve tu contraseña ni tu clave secreta —
          solo un acceso que podés revocar cuando quieras, desde acá o desde tu cuenta de Mercado Pago.
        </p>
        <MercadoPagoConnect connected={!!connection} />
        {connection && !connection.live_mode && (
          <p className="text-xs mt-3" style={{ color: '#FF8C00' }}>⚠ Conectado en modo de prueba (sandbox) — los cobros no son reales todavía.</p>
        )}
      </div>
    </div>
  )
}
