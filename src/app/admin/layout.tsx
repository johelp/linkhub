import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { appEnv } from '@/lib/env'
import { AdminNav } from './AdminNav'

export const metadata = { title: 'Admin | LinkHub', robots: { index: false, follow: false } }

// Not the per-customer /dashboard: this is the platform owner's panel across
// every account. Login is enforced by src/proxy.ts; the admin check runs here,
// server-side, on every request. A logged-in non-admin gets a plain 404, not
// a redirect that would confirm the route exists.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  if (!isAdminEmail(user.email)) notFound()

  return (
    <div className="min-h-screen lg:flex" style={{ background: '#F6F6F5' }}>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#1A1B1C] focus:text-white focus:text-sm focus:font-semibold">Saltar al contenido</a>
      <AdminNav email={user.email!} env={appEnv()} />
      <main id="contenido" tabIndex={-1} className="flex-1 min-w-0 pt-[6.5rem] pb-10 lg:pt-0 outline-none">{children}</main>
    </div>
  )
}
