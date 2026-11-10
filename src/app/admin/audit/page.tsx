import { createAdminClient } from '@/lib/supabase/admin'
import { classifyDbError, dbFailureMessage } from '@/lib/dbErrors'

export const metadata = { title: 'Auditoría | Admin' }
export const dynamic = 'force-dynamic'
const LABELS: Record<string, string> = { 'plan.set': 'Cambió el plan', 'page.publish': 'Publicó una página', 'page.unpublish': 'Despublicó una página (moderación)', 'flag.set': 'Modificó una función', 'flag.override': 'Función para un cliente', 'user.suspend': 'Suspendió una cuenta', 'user.unsuspend': 'Reactivó una cuenta' }

export default async function AuditPage() {
  const { data, error } = await createAdminClient().from('admin_audit_log' as never).select('id, actor_email, action, target, detail, created_at').order('created_at' as never, { ascending: false }).limit(200)
  const rows = (error ? [] : data ?? []) as unknown as { id: number; actor_email: string; action: string; target: string | null; detail: unknown; created_at: string }[]
  const fmt = (d: string) => new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[980px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Auditoría</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-5">Cada acción de administración queda registrada: quién, qué y cuándo. No se puede editar desde la app.</p>
      {error && <p className="rounded-xl p-3.5 mb-4 text-[13px]" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>{dbFailureMessage(classifyDbError(error) ?? 'other', '013_hardening_phase2.sql')}</p>}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(26,27,28,0.08)' }}>
        {rows.length === 0 ? <p className="p-8 text-center text-sm text-[#6B6E71]">Todavía no hay acciones registradas.</p> : (
          <ul>{rows.map(r => (
            <li key={r.id} className="px-5 py-3.5 border-b last:border-0 text-[13px]" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
              <div className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-[#1A1B1C]">{LABELS[r.action] ?? r.action}</b><span className="text-xs text-[#6B6E71]">{fmt(r.created_at)}</span></div>
              <p className="text-xs text-[#5A5D60]">{r.actor_email}{r.target ? ` → ${r.target}` : ''}{r.detail ? ` · ${JSON.stringify(r.detail)}` : ''}</p>
            </li>))}</ul>)}
      </div>
    </div>
  )
}
