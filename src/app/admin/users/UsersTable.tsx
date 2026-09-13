'use client'
import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { PlanSelect } from './PlanSelect'
import { formatDate } from '@/lib/utils'
import type { Plan } from '@/types'

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const BORDER = 'rgba(26,27,28,0.09)'

export interface AdminUserRow {
  id: string
  email: string
  full_name: string | null
  plan: Plan
  created_at: string
  pageCount: number
}

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => u.email.toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q))
  }, [users, query])

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 14, maxWidth: 320 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: LIGHT }} />
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por email o nombre..."
          style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: `1.5px solid ${BORDER}`, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F6F6F5' }}>
              <th style={th}>Usuario</th>
              <th style={th}>Plan</th>
              <th style={th}>Páginas</th>
              <th style={th}>Alta</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 20, color: LIGHT, textAlign: 'center' }}>Sin resultados.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={td}>
                  <p style={{ fontSize: 13, color: INK, fontWeight: 600 }}>{u.full_name || u.email}</p>
                  {u.full_name && <p style={{ fontSize: 11.5, color: LIGHT }}>{u.email}</p>}
                </td>
                <td style={td}><PlanSelect userId={u.id} plan={u.plan} /></td>
                <td style={{ ...td, color: MUTED }}>{u.pageCount}</td>
                <td style={{ ...td, color: MUTED }}>{formatDate(u.created_at)}</td>
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
