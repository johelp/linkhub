import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import { DashNav } from './DashNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase.from('profiles').select('full_name, plan').eq('id', user.id).single()
  const name = profile?.full_name || user.email || ''

  return (
    <div className="min-h-screen lg:flex" style={{ background: '#F6F6F5' }}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#1A1B1C] focus:text-white focus:text-sm focus:font-semibold">
        Saltar al contenido
      </a>
      <DashNav name={name} initial={(name[0] || '?').toUpperCase()} plan={profile?.plan || 'free'} isAdmin={isAdminEmail(user.email)} />
      {/* top/bottom padding clears the fixed mobile bars */}
      <main id="contenido" tabIndex={-1} className="flex-1 min-w-0 pt-14 pb-20 lg:pt-0 lg:pb-0 outline-none">{children}</main>
    </div>
  )
}
