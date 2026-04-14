import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Globe, Edit2, QrCode } from 'lucide-react'
import { PLAN_LIMITS } from '@/types'
import { formatDate, formatNumber } from '@/lib/utils'
import { NewPageButton } from './NewPageButton'

export const metadata = { title: 'Mis páginas | LinkHub' }

const S = {
  page: { padding: 24, maxWidth: 900 } as React.CSSProperties,
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 } as React.CSSProperties,
  h1: { fontSize: 20, fontWeight: 700, color: '#1A1B1C' } as React.CSSProperties,
  sub: { fontSize: 13, color: '#9A9D9F', marginTop: 2 } as React.CSSProperties,
  banner: { marginBottom: 20, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FEF0EF', border: '1px solid rgba(232,21,10,0.15)' } as React.CSSProperties,
  bannerText: { fontSize: 13, fontWeight: 600, color: '#E8150A' } as React.CSSProperties,
  bannerSub: { fontSize: 12, color: '#B50F07', marginTop: 2 } as React.CSSProperties,
  bannerBtn: { fontSize: 12, fontWeight: 700, color: '#fff', background: '#E8150A', padding: '8px 16px', borderRadius: 20, textDecoration: 'none', flexShrink: 0 } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 } as React.CSSProperties,
  empty: { textAlign: 'center', padding: '80px 0' } as React.CSSProperties,
  emptyIcon: { fontSize: 56, marginBottom: 16 } as React.CSSProperties,
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#1A1B1C', marginBottom: 8 } as React.CSSProperties,
  emptySub: { fontSize: 14, color: '#9A9D9F', marginBottom: 24 } as React.CSSProperties,
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: profile }, { data: pages }] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
    supabase.from('pages_summary').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ])

  const plan = (profile?.plan || 'free') as 'free' | 'pro' | 'agency'
  const limits = PLAN_LIMITS[plan]
  const pageList = pages || []
  const canCreate = pageList.length < limits.pages

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Mis páginas</h1>
          <p style={S.sub}>
            {pageList.length} {pageList.length === 1 ? 'página' : 'páginas'}
            {plan === 'free' && ` · Plan Free (máx. ${limits.pages})`}
          </p>
        </div>
        <NewPageButton canCreate={canCreate} plan={plan} />
      </div>

      {plan === 'free' && (
        <div style={S.banner}>
          <div>
            <p style={S.bannerText}>¿Necesitás temporadas, idiomas o más bloques?</p>
            <p style={S.bannerSub}>Pasate a Pro y desbloqueá todos los bloques por €19/mes</p>
          </div>
          <Link href="/dashboard/upgrade" style={S.bannerBtn}>Ver Pro →</Link>
        </div>
      )}

      {pageList.length === 0
        ? <EmptyState canCreate={canCreate} />
        : (
          <div style={S.grid}>
            {pageList.map((p: any) => <PageCard key={p.id} page={p} />)}
            {canCreate && <NewPageButton canCreate={true} plan={plan} asCard />}
          </div>
        )
      }
    </div>
  )
}

function PageCard({ page }: { page: any }) {
  const accent = page.primary_color || '#E8150A'
  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(26,27,28,0.09)' }}>
      <div style={{ height: 4, background: accent }} />
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1B1C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.name}</p>
            <p style={{ fontSize: 11, color: '#9A9D9F', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>linkhub.app/p/{page.slug}</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, marginLeft: 8, flexShrink: 0, background: page.published ? '#ECFDF5' : '#F2F3F4', color: page.published ? '#16A34A' : '#9A9D9F' }}>
            {page.published ? '● Publicada' : '○ Borrador'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#9A9D9F', marginBottom: 14, display: 'flex', gap: 6 }}>
          <span>{page.block_count ?? 0} bloques</span>
          <span>·</span>
          <span>{formatNumber(page.views ?? 0)} vistas</span>
          <span>·</span>
          <span>{formatDate(page.updated_at)}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link href={`/editor/${page.id}`}
            style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, padding: '8px 0', borderRadius: 10, background: '#FEF0EF', color: '#E8150A', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Edit2 size={12} /> Editar
          </Link>
          {page.published && (
            <Link href={`/p/${page.slug}`} target="_blank"
              style={{ padding: '8px 10px', borderRadius: 10, background: '#F6F6F5', color: '#5A5D60', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Globe size={13} />
            </Link>
          )}
          <Link href={`/dashboard/qr/${page.id}`}
            style={{ padding: '8px 10px', borderRadius: 10, background: '#F6F6F5', color: '#5A5D60', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <QrCode size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <div style={S.empty}>
      <div style={S.emptyIcon}>🔗</div>
      <h2 style={S.emptyTitle}>Todavía no tenés páginas</h2>
      <p style={S.emptySub}>Creá tu primera página de enlaces en menos de 2 minutos</p>
      {canCreate && <NewPageButton canCreate={true} plan="free" />}
    </div>
  )
}
