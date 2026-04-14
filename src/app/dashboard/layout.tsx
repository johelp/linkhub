import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Settings, BarChart2 } from 'lucide-react'
import { SignOutButton } from './SignOutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles').select('full_name, plan').eq('id', user.id).single()

  const plan = profile?.plan || 'free'
  const planColors: Record<string, string> = { free: '#9A9D9F', pro: '#E8150A', agency: '#7C3AED' }
  const initial = (profile?.full_name || user.email || '?')[0].toUpperCase()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F6F6F5' }}>
      {/* SIDEBAR */}
      <aside style={{ width: 220, display: 'flex', flexDirection: 'column', padding: '20px 12px', background: '#fff', borderRight: '1px solid rgba(26,27,28,0.09)', flexShrink: 0 }}>
        <Link href="/dashboard" style={{ padding: '0 12px', marginBottom: 24, display: 'block', textDecoration: 'none' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1A1B1C' }}>Link<span style={{ color: '#E8150A' }}>Hub</span></span>
        </Link>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavLink href="/dashboard" icon={<LayoutDashboard size={15} />} label="Mis páginas" />
          <NavLink href="/dashboard/upgrade" icon={<BarChart2 size={15} />} label="Analíticas" />
          <NavLink href="/dashboard/upgrade" icon={<Settings size={15} />} label="Ajustes" />
        </nav>

        <div style={{ paddingTop: 16, borderTop: '1px solid rgba(26,27,28,0.09)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8150A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#1A1B1C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name || user.email}
              </p>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: planColors[plan] }}>
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

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: '#5A5D60', textDecoration: 'none' }}>
      {icon}{label}
    </Link>
  )
}
