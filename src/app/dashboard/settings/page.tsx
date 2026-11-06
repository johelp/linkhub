import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFlagsForUser } from '@/lib/flags.server'

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

      <div className="grid gap-3">
        {[
          { href: '/dashboard/payments', icon: '💳', title: 'Cobros online', text: 'Conecta Mercado Pago, Stripe o el TPV de tu banco (Redsys) con un asistente paso a paso.' },
          { href: '/dashboard/knowledge', icon: '📚', title: 'Base de conocimiento', text: 'Preguntas frecuentes, políticas y datos de tu negocio para tu página, Google y asistentes de IA.' },
          { href: '/dashboard/contacts', icon: '✉️', title: 'Contactos', text: 'Los emails que dejan tus visitantes.' },
          { href: '/dashboard/roadmap', icon: '💡', title: 'Próximamente', text: 'Vota las funciones que te gustaría ver primero.' },
          { href: '/dashboard/upgrade', icon: '✨', title: 'Plan y facturación', text: 'Tu suscripción y las ventajas de Pro.' },
        ].map(c => (
          <Link key={c.href} href={c.href} className="flex items-center gap-4 bg-white rounded-2xl p-5 no-underline hover:shadow-md transition-shadow" style={{ border: '1px solid rgba(26,27,28,0.08)' }}>
            <span className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-[#F6F6F4]" aria-hidden>{c.icon}</span>
            <span className="flex-1 min-w-0"><span className="block text-[15px] font-bold text-[#1A1B1C]">{c.title}</span><span className="block text-[13px] text-[#5A5D60]">{c.text}</span></span>
            <span className="text-[#5A5D60]" aria-hidden>→</span>
          </Link>
        ))}
      </div>

      {/* Mobile has no sidebar item for this (desktop lists it under "Cuenta"). */}
      {(await getFlagsForUser(user.id, user.email)).developer_api && (
        <Link href="/dashboard/developers" className="flex items-center gap-4 bg-white rounded-2xl p-5 mt-3 no-underline hover:shadow-md transition-shadow" style={{ border: '1px solid rgba(26,27,28,0.08)' }}>
          <span className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: '#F2F3F4' }} aria-hidden>{'</>'}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-bold text-[#1A1B1C]">Desarrolladores</span>
            <span className="block text-[13px] text-[#5A5D60]">API keys para conectar tus páginas con tus herramientas y con asistentes de IA (MCP).</span>
          </span>
          <span className="text-[#5A5D60]" aria-hidden>→</span>
        </Link>
      )}
    </div>
  )
}
