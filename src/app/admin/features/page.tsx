import { listFlagConfig } from '@/lib/flags.server'
import { FLAGS, FLAG_KEYS } from '@/lib/flags'
import { FlagsEditor } from './FlagsEditor'

export const metadata = { title: 'Funciones | Admin' }
export const dynamic = 'force-dynamic'

export default async function FeaturesPage() {
  const cfg = await listFlagConfig()
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
      <p className="text-sm text-[#5A5D60] mt-1 mb-5 max-w-2xl">Lanzá cada función de a poco: primero a clientes puntuales, después a un porcentaje y por último a todos. Los administradores ven todo siempre, para probar en producción.</p>
      {!cfg.ready && <p className="rounded-xl p-3.5 mb-5 text-[13px]" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>Falta aplicar la migración <code>016_feature_flags.sql</code>. Mientras tanto rigen los valores por defecto del código (las funciones nuevas están apagadas).</p>}
      <FlagsEditor flags={flags} />
    </div>
  )
}
