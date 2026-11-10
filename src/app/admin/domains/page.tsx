import { createAdminClient } from '@/lib/supabase/admin'
import { classifyDbError, dbFailureMessage } from '@/lib/dbErrors'
import { DomainsTable, type AdminDomainRow } from './DomainsTable'

export const metadata = { title: 'Dominios | Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminDomainsPage() {
  const { data, error } = await createAdminClient().from('custom_domains' as never)
    .select('id, domain, status, verified_at, activated_at, last_error, created_at, pages(name, slug, profiles:user_id(email))').order('created_at', { ascending: false }).limit(200)
  const rows = ((data ?? []) as unknown as { id: string; domain: string; status: AdminDomainRow['status']; verified_at: string | null; activated_at: string | null; created_at: string; pages: { name: string; slug: string; profiles: { email: string } | { email: string }[] | null } | { name: string; slug: string; profiles: { email: string } | { email: string }[] | null }[] | null }[])
    .map(r => {
      const pg = Array.isArray(r.pages) ? r.pages[0] : r.pages
      const prof = pg && (Array.isArray(pg.profiles) ? pg.profiles[0] : pg.profiles)
      return { id: r.id, domain: r.domain, status: r.status, pageName: pg?.name ?? '—', owner: prof?.email ?? '—', created_at: r.created_at }
    })
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[980px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Dominios propios</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-5 max-w-2xl">Para activar un dominio verificado: 1) añádelo en Vercel (Project → Settings → Domains), 2) espera a que Vercel lo marque como válido, 3) pulsa «Activar» aquí. Al quitar un dominio, bórralo también de Vercel.</p>
      {error && <p className="rounded-xl p-3.5 mb-5 text-[13px]" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>{dbFailureMessage(classifyDbError(error) ?? 'other', '021_custom_domains.sql')}</p>}
      <DomainsTable rows={rows} />
    </div>
  )
}
