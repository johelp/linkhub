import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { getPaymentsStatus } from '@/lib/payments'
import { PaymentsWizard } from './PaymentsWizard'

export const metadata: Metadata = { title: 'Cobros | LinkHub' }

interface Props { searchParams: Promise<{ result?: string; provider?: string }> }

export default async function PaymentsPage({ searchParams }: Props) {
  const { result, provider } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [status, { data: profile }] = await Promise.all([
    getPaymentsStatus(supabase, user.id),
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
  ])

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[860px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Cobros online</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-6 max-w-xl">
        Recibí pagos directo en tu cuenta, con Mercado Pago, Stripe o el TPV de tu banco (Redsys). Te guiamos en 3 pasos; no hace falta saber de tecnología.
      </p>
      <PaymentsWizard status={status} result={result ?? null} resultProvider={provider ?? null} isAdmin={isAdminEmail(user.email)} isPro={profile?.plan === 'pro'} />
    </div>
  )
}
