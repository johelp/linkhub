import { createAdminClient } from '@/lib/supabase/admin'
import { UsersTable, type AdminUserRow } from './UsersTable'
import type { Plan } from '@/types'

const INK = '#1A1B1C'
const LIGHT = '#9A9D9F'

export const metadata = { title: 'Usuarios | Admin | LinkHub' }

export default async function AdminUsersPage() {
  const admin = createAdminClient()

  const [{ data: profiles }, { data: pages }] = await Promise.all([
    admin.from('profiles').select('id, email, full_name, plan, created_at').order('created_at', { ascending: false }),
    admin.from('pages').select('user_id'),
  ])

  const pageCountByUser = new Map<string, number>()
  for (const p of pages || []) {
    pageCountByUser.set(p.user_id, (pageCountByUser.get(p.user_id) || 0) + 1)
  }

  const users: AdminUserRow[] = (profiles || []).map(p => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    plan: p.plan as Plan,
    created_at: p.created_at,
    pageCount: pageCountByUser.get(p.id) || 0,
  }))

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 4 }}>Usuarios</h1>
      <p style={{ fontSize: 13, color: LIGHT, marginBottom: 20 }}>{users.length} en total. Cambiar el plan acá lo aplica al toque, sin pasar por Stripe.</p>
      <UsersTable users={users} />
    </div>
  )
}
