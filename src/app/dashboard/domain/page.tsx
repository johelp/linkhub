import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getFlagsForUser } from '@/lib/flags.server'
import { PLAN_LIMITS, type Plan } from '@/types'
import { dnsRecords } from '@/lib/domains'
import { DomainManager, type DomainRow, type PageOption } from './DomainManager'

export const metadata: Metadata = { title: 'Dominio propio | LinkHub' }
export const dynamic = 'force-dynamic'

export default async function DomainPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const flags = await getFlagsForUser(user.id, user.email)
  if (!flags.custom_domain) redirect('/dashboard/settings')

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const plan = ((profile as { plan?: Plan } | null)?.plan ?? 'free') as Plan
  const pro = PLAN_LIMITS[plan].customDomain

  const [{ data: pages }, { data: doms }] = await Promise.all([
    supabase.from('pages').select('id, name, slug').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('custom_domains' as never).select('id, page_id, domain, status, token, last_error'),
  ])
  const rows = ((doms ?? []) as unknown as { id: string; page_id: string; domain: string; status: DomainRow['status']; token: string; last_error: string | null }[])
    .map(d => ({ ...d, records: dnsRecords(d.domain, d.token) }))

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[860px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Dominio propio</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-6 max-w-2xl">Muestra tu página en tu propio dominio, por ejemplo <b>www.tunegocio.com</b>, con candado de seguridad incluido. Necesitas ser dueño del dominio y poder editar su DNS.</p>
      {!pro ? (
        <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid rgba(26,27,28,0.08)' }}>
          <p className="text-[15px] text-[#1A1B1C] font-semibold">El dominio propio es una función del plan Pro.</p>
          <Link href="/dashboard/upgrade" className="inline-block mt-3 underline text-[14px]">Ver planes</Link>
        </div>
      ) : (
        <DomainManager pages={(pages ?? []) as PageOption[]} domains={rows} />
      )}
    </div>
  )
}
