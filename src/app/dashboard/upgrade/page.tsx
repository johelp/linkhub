import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UpgradeButton } from './UpgradeButton'

export const metadata: Metadata = { title: 'Actualizar plan | LinkHub' }

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const isPro = profile?.plan === 'pro'
  const paymentsConfigured = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/dashboard" className="text-sm" style={{ color: '#9A9D9F' }}>← Dashboard</Link>
      <h1 className="text-2xl font-bold mt-4 mb-2" style={{ color: '#1A1B1C' }}>{isPro ? 'Tu plan' : 'Actualizá tu plan'}</h1>
      <p className="text-sm mb-8" style={{ color: '#9A9D9F' }}>
        {isPro ? 'Ya tenés todo desbloqueado con el plan Pro.' : 'Desbloqueá todos los bloques, multiidioma, filtros de temporada y más.'}
      </p>

      <div className="max-w-sm">
        <div className="bg-white rounded-2xl p-6 border-2" style={{ borderColor: '#E8150A' }}>
          <div className="inline-block text-xs font-bold px-2 py-1 rounded-full mb-3" style={{ background: '#FEF0EF', color: '#E8150A' }}>
            Todo incluido
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: '#1A1B1C' }}>Pro</h2>
          <div className="text-3xl font-bold mb-4" style={{ color: '#1A1B1C' }}>€19<span className="text-base font-normal" style={{ color: '#9A9D9F' }}>/mes</span></div>
          <ul className="space-y-2 mb-6 text-sm" style={{ color: '#5A5D60' }}>
            {[
              '✓ Páginas ilimitadas',
              '✓ Todos los bloques (acordeones, destacados, redes...)',
              '✓ Multiidioma (ES, EN, PT, FR, DE, IT)',
              '✓ Filtros de temporada por bloque',
              '✓ QR personalizado SVG + PNG',
              '✓ Analíticas completas + export CSV',
              '✓ Dominio propio',
              '✓ Soporte prioritario',
            ].map(f => <li key={f}>{f}</li>)}
          </ul>
          <UpgradeButton isPro={isPro} paymentsConfigured={paymentsConfigured} />
        </div>
      </div>

      <p className="text-xs text-center mt-6" style={{ color: '#9A9D9F' }}>
        ¿Preguntas sobre tu cuenta? Escribinos a{' '}
        <a href="mailto:hola@linkhub.app" className="underline">hola@linkhub.app</a>.
      </p>
    </div>
  )
}
