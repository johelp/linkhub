import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import { DashNav } from './DashNav'
import Link from 'next/link'
import { availability, graceDays, pauseDate } from '@/lib/billing'

// Kept outside the component: it reads the clock.
const billingStatus = (lapsedAt: string | null) => availability(lapsedAt, Date.now(), graceDays())

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const lapsedAt = (profile as { billing_lapsed_at?: string | null } | null)?.billing_lapsed_at ?? null
  const status = billingStatus(lapsedAt)
  const name = profile?.full_name || user.email || ''

  return (
    <div className="min-h-screen lg:flex" style={{ background: '#F6F6F5' }}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#1A1B1C] focus:text-white focus:text-sm focus:font-semibold">
        Saltar al contenido
      </a>
      <DashNav name={name} initial={(name[0] || '?').toUpperCase()} plan={profile?.plan || 'free'} isAdmin={isAdminEmail(user.email)} />
      {/* top/bottom padding clears the fixed mobile bars */}
      <main id="contenido" tabIndex={-1} className="flex-1 min-w-0 pt-14 pb-20 lg:pt-0 lg:pb-0 outline-none">
        {status !== 'active' && lapsedAt && (
          <div role="status" className="mx-4 sm:mx-6 lg:mx-8 mt-4 lg:mt-6 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3" style={{ background: status === 'paused' ? '#FEF0EF' : '#FFF7ED', border: `1px solid ${status === 'paused' ? '#F6C6C3' : '#FED7AA'}` }}>
            <p className="text-[14px] font-semibold" style={{ color: status === 'paused' ? '#991B1B' : '#9A3412' }}>
              {status === 'paused'
                ? 'Tus páginas están en pausa: tus visitantes ven un aviso de “volvemos enseguida”. Actualiza tu método de pago para reactivarlas.'
                : `No hemos podido cobrar tu suscripción. Actualiza tu método de pago antes del ${new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(pauseDate(lapsedAt, graceDays()))} para que tus páginas sigan visibles.`}
            </p>
            <Link href="/dashboard/upgrade" className="h-10 px-4 rounded-xl text-[13px] font-semibold text-white no-underline flex items-center" style={{ background: status === 'paused' ? '#B91C1C' : '#9A3412' }}>Actualizar pago</Link>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
