import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Ajustes | LinkHub' }

interface Props {
  searchParams: Promise<{ mp?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const { mp } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  // Old links / OAuth returns that still point here.
  if (mp) redirect(`/dashboard/payments?result=${mp}&provider=mercadopago`)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[760px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Ajustes</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-6">Tu cuenta y tus conexiones.</p>

      <Link href="/dashboard/payments" className="flex items-center gap-4 bg-white rounded-2xl p-5 no-underline hover:shadow-md transition-shadow" style={{ border: '1px solid rgba(26,27,28,0.08)' }}>
        <span className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: '#E6F5FC' }} aria-hidden>💳</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-bold text-[#1A1B1C]">Cobros online</span>
          <span className="block text-[13px] text-[#5A5D60]">Conectá Mercado Pago, Stripe o el TPV de tu banco (Redsys) con un asistente paso a paso.</span>
        </span>
        <span className="text-[#5A5D60]" aria-hidden>→</span>
      </Link>
    </div>
  )
}
