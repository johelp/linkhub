import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatNumber } from '@/lib/utils'

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const BORDER = 'rgba(26,27,28,0.09)'
const R = '#E8150A'

const PRO_PRICE_EUR = 19

export default async function AdminOverviewPage() {
  const admin = createAdminClient()

  const sevenDaysAgoDate = new Date()
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7)
  const sevenDaysAgo = sevenDaysAgoDate.toISOString()

  const [{ data: profiles }, { data: pages }] = await Promise.all([
    admin.from('profiles').select('id, email, plan, created_at').order('created_at', { ascending: false }),
    admin.from('pages').select('id, published, views'),
  ])

  const allProfiles = profiles || []
  const allPages = pages || []

  const proCount = allProfiles.filter(p => p.plan === 'pro').length
  const freeCount = allProfiles.length - proCount
  const newThisWeek = allProfiles.filter(p => p.created_at >= sevenDaysAgo).length
  const publishedPages = allPages.filter(p => p.published).length
  const totalViews = allPages.reduce((sum, p) => sum + (p.views || 0), 0)
  const mrr = proCount * PRO_PRICE_EUR

  const stats = [
    { label: 'Usuarios totales', value: formatNumber(allProfiles.length), sub: `+${newThisWeek} esta semana` },
    { label: 'Plan Pro', value: formatNumber(proCount), sub: `${formatNumber(freeCount)} en Free` },
    { label: 'MRR estimado', value: `€${formatNumber(mrr)}`, sub: `${proCount} × €${PRO_PRICE_EUR}/mes` },
    { label: 'Páginas', value: formatNumber(allPages.length), sub: `${formatNumber(publishedPages)} publicadas` },
    { label: 'Vistas totales', value: formatNumber(totalViews), sub: 'acumuladas, todas las páginas' },
  ]

  const recentUsers = allProfiles.slice(0, 8)

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 4 }}>Resumen</h1>
      <p style={{ fontSize: 13, color: LIGHT, marginBottom: 24 }}>Estado de la plataforma en este momento.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: INK }}>{s.value}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginTop: 2 }}>{s.label}</p>
            <p style={{ fontSize: 11, color: LIGHT, marginTop: 4 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: INK }}>Altas recientes</h2>
        <Link href="/admin/users" style={{ fontSize: 12, fontWeight: 600, color: R, textDecoration: 'none' }}>Ver todos →</Link>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        {recentUsers.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: LIGHT }}>Todavía no hay usuarios registrados.</p>
        ) : recentUsers.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 13, color: INK }}>{p.email}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px', color: p.plan === 'pro' ? R : LIGHT }}>{p.plan}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
