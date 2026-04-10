import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Settings, BarChart2 } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan')
    .eq('id', user.id)
    .single()

  const planColors: Record<string, string> = {
    free: '#9A9D9F',
    pro: '#E8150A',
    agency: '#7C3AED',
  }
  const plan = profile?.plan || 'free'

  return (
    <div className="flex h-screen" style={{background:'#F6F6F5'}}>
      {/* SIDEBAR */}
      <aside className="w-56 flex flex-col py-5 px-3" style={{background:'#fff',borderRight:'1px solid rgba(26,27,28,0.09)'}}>
        <Link href="/dashboard" className="px-3 mb-6 block">
          <span className="text-lg font-bold" style={{color:'#1A1B1C'}}>Link<span style={{color:'#E8150A'}}>Hub</span></span>
        </Link>

        <nav className="flex-1 space-y-1">
          <SideLink href="/dashboard" icon={<LayoutDashboard size={16}/>} label="Mis páginas" />
          <SideLink href="/dashboard/analytics" icon={<BarChart2 size={16}/>} label="Analíticas" />
          <SideLink href="/dashboard/settings" icon={<Settings size={16}/>} label="Ajustes" />
        </nav>

        <div className="px-3 pt-4 border-t" style={{borderColor:'rgba(26,27,28,0.09)'}}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{background:'#E8150A'}}>
              {(profile?.full_name || user.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{color:'#1A1B1C'}}>{profile?.full_name || user.email}</p>
              <span className="text-xs font-bold uppercase tracking-wide" style={{color: planColors[plan]}}>
                {plan}
              </span>
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-colors hover:bg-gray-50" style={{color:'#9A9D9F'}}>
              <LogOut size={13}/> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function SideLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
      style={{color:'#5A5D60'}}
      onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#F6F6F5' }}
      onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
      {icon}
      {label}
    </Link>
  )
}
