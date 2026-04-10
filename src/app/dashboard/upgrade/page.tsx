import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Actualizar plan | LinkHub' }

export default function UpgradePage() {
  return (
    <div className="p-6 max-w-2xl">
      <Link href="/dashboard" className="text-sm" style={{ color: '#9A9D9F' }}>← Dashboard</Link>
      <h1 className="text-2xl font-bold mt-4 mb-2" style={{ color: '#1A1B1C' }}>Actualizá tu plan</h1>
      <p className="text-sm mb-8" style={{ color: '#9A9D9F' }}>
        Desbloqueá todos los bloques, multiidioma, filtros de temporada y más.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pro */}
        <div className="bg-white rounded-2xl p-6 border-2" style={{ borderColor: '#E8150A' }}>
          <div className="inline-block text-xs font-bold px-2 py-1 rounded-full mb-3" style={{ background: '#FEF0EF', color: '#E8150A' }}>
            Más popular
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
              '✓ Analíticas completas (clics, países, dispositivos)',
            ].map(f => <li key={f}>{f}</li>)}
          </ul>
          <button className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#E8150A' }}>
            Próximamente · Stripe
          </button>
        </div>

        {/* Agency */}
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'rgba(26,27,28,0.09)' }}>
          <h2 className="text-xl font-bold mb-1" style={{ color: '#1A1B1C' }}>Agency</h2>
          <div className="text-3xl font-bold mb-4" style={{ color: '#1A1B1C' }}>€49<span className="text-base font-normal" style={{ color: '#9A9D9F' }}>/mes</span></div>
          <ul className="space-y-2 mb-6 text-sm" style={{ color: '#5A5D60' }}>
            {[
              '✓ Todo lo de Pro',
              '✓ Dominio propio (beta)',
              '✓ Export CSV de analíticas',
              '✓ Soporte prioritario',
              '✓ White-label (próximamente)',
            ].map(f => <li key={f}>{f}</li>)}
          </ul>
          <button className="w-full py-3 rounded-xl text-sm font-bold" style={{ background: '#F2F3F4', color: '#1A1B1C' }}>
            Próximamente · Contacto
          </button>
        </div>
      </div>

      <p className="text-xs text-center mt-6" style={{ color: '#9A9D9F' }}>
        Los pagos se integran en la próxima fase con Stripe. Por ahora, contactá a{' '}
        <a href="mailto:hola@linkhub.app" className="underline">hola@linkhub.app</a> para activar Pro manualmente.
      </p>
    </div>
  )
}
