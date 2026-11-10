import { listFlagConfig } from '@/lib/flags.server'
import { FLAGS, FLAG_KEYS } from '@/lib/flags'
import { FlagsEditor } from './FlagsEditor'
import { ROADMAP } from '@/lib/roadmap'
import { classifyDbError, dbFailureMessage } from '@/lib/dbErrors'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Funciones | Admin' }
export const dynamic = 'force-dynamic'

export default async function FeaturesPage() {
  const cfg = await listFlagConfig()
  // Votes per upcoming feature (service role: customers only see their own).
  const votesRes = await createAdminClient().from('roadmap_votes' as never).select('item_key')
  const votes = new Map<string, number>()
  for (const v of ((votesRes.data ?? []) as unknown as { item_key: string }[])) votes.set(v.item_key, (votes.get(v.item_key) ?? 0) + 1)
  const ranking = ROADMAP.map(i => ({ ...i, n: votes.get(i.id) ?? 0 })).sort((a, b) => b.n - a.n)
  const flags = FLAG_KEYS.map(key => {
    const row = cfg.rows.find(r => r.key === key)
    return {
      key, label: FLAGS[key].label, description: FLAGS[key].description, codeDefault: FLAGS[key].default,
      enabled_default: row?.enabled_default ?? FLAGS[key].default, rollout_percent: row?.rollout_percent ?? 0, note: row?.note ?? '',
      overrides: cfg.overrides.filter(o => o.flag_key === key).map(o => ({ user_id: o.user_id, enabled: o.enabled, email: (Array.isArray(o.profiles) ? o.profiles[0]?.email : o.profiles?.email) ?? o.user_id })),
    }
  })
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[980px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Funciones</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-5 max-w-2xl">Lanza cada función poco a poco: primero a clientes puntuales, después a un porcentaje y por último a todos. Los administradores ven todo siempre, para probar en producción.</p>
      {!cfg.ready && <p className="rounded-xl p-3.5 mb-5 text-[13px]" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>{dbFailureMessage(classifyDbError(cfg.rowsError) ?? 'other', '016_feature_flags.sql')} Mientras tanto rigen los valores por defecto del código (las funciones nuevas están apagadas).</p>}
      <FlagsEditor flags={flags} />

      <h2 className="text-[18px] font-bold text-[#1A1B1C] mt-10 mb-1">Próximamente: votos de los clientes</h2>
      <p className="text-sm text-[#5A5D60] mb-3 max-w-2xl">Qué piden más. Es una señal para priorizar, no una encuesta representativa.</p>
      {votesRes.error && <p className="rounded-xl p-3.5 mb-3 text-[13px]" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>{dbFailureMessage(classifyDbError(votesRes.error) ?? 'other', '020_roadmap_votes.sql')}</p>}
      <ul className="bg-white rounded-2xl" style={{ listStyle: 'none', padding: 0, margin: 0, border: '1px solid rgba(26,27,28,0.08)' }}>
        {ranking.map((i, idx) => (
          <li key={i.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: idx ? '1px solid rgba(26,27,28,0.06)' : 'none' }}>
            <span aria-hidden>{i.icon}</span><span className="flex-1 text-[14px] text-[#1A1B1C]">{i.title}</span>
            <span className="text-[14px] font-bold tabular-nums">{i.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
