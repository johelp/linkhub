import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, TrendingUp, Settings } from 'lucide-react'
import { SignOutButton } from './SignOutButton'

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const BORDER = 'rgba(26,27,28,0.09)'
const SNOW = '#F6F6F5'
const R = '#E8150A'

const planColors: Record<string, string> = { free: LIGHT, pro: R, agency: '#7C3AED' }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles').select('full_name, plan').eq('id', user.id).single()

  const plan = (profile?.plan || 'free') as string
  const initial = (profile?.full_name || user.email || '?')[0].toUpperCase()
  const displayName = profile?.full_name || user.email || ''

  return (
    <div style={{ display: 'flex', height: '100vh', background: SNOW, fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '20px 12px', background: '#fff', borderRight: `1px solid ${BORDER}` }}>

        <Link href="/dashboard" style={{ padding: '0 10px', marginBottom: 28, display: 'block', textDecoration: 'none' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: INK }}>Link<span style={{ color: R }}>Hub</span></span>
        </Link>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SideLink href="/dashboard" icon={<LayoutDashboard size={15} />} label="Mis páginas" />
          <SideLink href="/dashboard/upgrade" icon={<TrendingUp size={15} />} label="Planes" />
          <SideLink href="/dashboard/upgrade" icon={<Settings size={15} />} label="Ajustes" />
        </nav>

        <div style={{ paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 8px', marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: R, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </p>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: planColors[plan] || LIGHT }}>
                {plan}
              </span>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

function SideLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: MUTED, textDecoration: 'none' }}>
      {icon}{label}
    </Link>
  )
}
