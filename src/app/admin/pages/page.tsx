import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, formatNumber } from '@/lib/utils'
import { PublishToggle } from './PublishToggle'

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const BORDER = 'rgba(26,27,28,0.09)'

export const metadata = { title: 'Páginas | Admin | LinkHub' }

export default async function AdminPagesPage() {
  const admin = createAdminClient()

  const [{ data: pages }, { data: profiles }] = await Promise.all([
    admin.from('pages').select('id, user_id, slug, name, published, views, created_at').order('created_at', { ascending: false }),
    admin.from('profiles').select('id, email'),
  ])

  const emailByUser = new Map((profiles || []).map(p => [p.id, p.email]))
  const pageList = pages || []

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 4 }}>Páginas</h1>
      <p style={{ fontSize: 13, color: LIGHT, marginBottom: 20 }}>
        {pageList.length} en total, de todos los usuarios. Despublicar acá saca la página del aire al toque, sin avisarle al dueño.
      </p>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F6F6F5' }}>
              <th style={th}>Página</th>
              <th style={th}>Dueño</th>
              <th style={th}>Vistas</th>
              <th style={th}>Creada</th>
              <th style={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pageList.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 20, color: LIGHT, textAlign: 'center' }}>Todavía no hay páginas.</td></tr>
            ) : pageList.map(p => (
              <tr key={p.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, color: INK }}>{p.name}</span>
                    {p.published && (
                      <Link href={`/p/${p.slug}`} target="_blank" style={{ color: LIGHT, display: 'flex' }} title="Ver página">
                        <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                  <p style={{ fontSize: 11.5, color: LIGHT }}>/p/{p.slug}</p>
                </td>
                <td style={{ ...td, color: MUTED }}>{emailByUser.get(p.user_id) || '—'}</td>
                <td style={{ ...td, color: MUTED }}>{formatNumber(p.views || 0)}</td>
                <td style={{ ...td, color: MUTED }}>{formatDate(p.created_at)}</td>
                <td style={td}><PublishToggle pageId={p.id} published={p.published} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 16px', color: LIGHT, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.3px' }
const td: React.CSSProperties = { padding: '11px 16px', verticalAlign: 'middle' }
