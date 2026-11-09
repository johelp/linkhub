import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getFlagsForUser } from '@/lib/flags.server'
import { formatDate } from '@/lib/utils'
import { DevelopersClient, type KeyView } from './DevelopersClient'

export const metadata: Metadata = { title: 'Desarrolladores | LinkHub' }

const card = { border: '1px solid rgba(26,27,28,0.08)' }
const isPast = (iso: string) => Date.parse(iso) <= Date.now()
const when = (d: string | null) => (d ? formatDate(d) : '—')

export default async function DevelopersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const enabled = (await getFlagsForUser(user.id, user.email)).developer_api
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app').replace(/\/$/, '')

  let keys: KeyView[] = []
  let audit: { action: string; target: string | null; created_at: string }[] = []
  if (enabled) {
    // Columns are limited by the migration's grants: the hash is never readable from the browser session.
    const k = await supabase.from('api_keys' as never).select('id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at').order('created_at' as never, { ascending: false })
    keys = ((k.data ?? []) as unknown as { id: string; name: string; key_prefix: string; scopes: string[]; last_used_at: string | null; expires_at: string | null; revoked_at: string | null; created_at: string }[])
      .map(r => ({ id: r.id, name: r.name, prefix: r.key_prefix, scopes: r.scopes, lastUsed: when(r.last_used_at), expires: r.expires_at ? formatDate(r.expires_at) : null, expired: !!r.expires_at && isPast(r.expires_at), revoked: !!r.revoked_at, created: when(r.created_at) }))
    const a = await supabase.from('api_key_audit' as never).select('action, target, created_at').order('created_at' as never, { ascending: false }).limit(10)
    audit = (a.data ?? []) as unknown as typeof audit
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[860px] mx-auto">
      <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-sm text-[#5A5D60] no-underline mb-3"><ArrowLeft size={14} aria-hidden />Ajustes</Link>
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Desarrolladores</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-6">Conecta tus páginas con tus propias herramientas y con asistentes de IA mediante API keys.</p>

      {!enabled ? (
        <div className="bg-white rounded-2xl p-5" style={card} role="status">
          <p className="text-[15px] font-bold text-[#1A1B1C]">Todavía no está disponible para tu cuenta</p>
          <p className="text-[13.5px] text-[#5A5D60] mt-1">La API para desarrolladores se está activando poco a poco. Cuando esté lista para ti, podrás crear tus claves aquí.</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="endpoints" className="bg-white rounded-2xl p-5 mb-5" style={card}>
            <h2 id="endpoints" className="text-[15px] font-bold text-[#1A1B1C] mb-2">Direcciones</h2>
            <dl className="text-[13px] grid gap-1.5">
              <div className="flex flex-wrap gap-x-2"><dt className="font-semibold text-[#1A1B1C]">Servidor MCP</dt><dd><code className="break-all">{appUrl}/api/mcp</code></dd></div>
              <div className="flex flex-wrap gap-x-2"><dt className="font-semibold text-[#1A1B1C]">API REST</dt><dd><code className="break-all">{appUrl}/api/v1/pages</code></dd></div>
              <div className="flex flex-wrap gap-x-2"><dt className="font-semibold text-[#1A1B1C]">Especificación OpenAPI</dt><dd><code className="break-all">{appUrl}/openapi.json</code></dd></div>
            </dl>
            <p className="text-[12.5px] text-[#5A5D60] mt-2">Envía la clave en la cabecera <code>Authorization: Bearer lh_…</code>. Guía completa en <code>docs/developers/api-keys-y-integraciones.md</code>.</p>
          </section>

          <DevelopersClient keys={keys} />

          <section aria-labelledby="actividad" className="bg-white rounded-2xl p-5 mt-5" style={card}>
            <h2 id="actividad" className="text-[15px] font-bold text-[#1A1B1C] mb-2">Últimos cambios hechos con tus claves</h2>
            {audit.length === 0 ? <p className="text-[13px] text-[#5A5D60]">Todavía no se ha escrito nada con una API key.</p> : (
              <ul className="text-[13px] divide-y" style={{ borderColor: 'rgba(26,27,28,0.08)' }}>
                {audit.map((a, i) => (
                  <li key={i} className="py-1.5 flex flex-wrap justify-between gap-2"><span><code>{a.action}</code>{a.target ? <span className="text-[#5A5D60]"> · {a.target.slice(0, 36)}</span> : null}</span><span className="text-[#5A5D60]">{formatDate(a.created_at)}</span></li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
