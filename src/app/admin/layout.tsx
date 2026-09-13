import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const BORDER = 'rgba(26,27,28,0.09)'
const SNOW = '#F6F6F5'
const R = '#E8150A'

export const metadata = { title: 'Admin | LinkHub' }

// Not the per-user /dashboard -- this is the LinkHub-operator panel across
// every account. Login is enforced by src/proxy.ts (same as /dashboard);
// the admin-email check happens here, server-side, on every request. A
// logged-in non-admin gets a plain 404, not a redirect that would confirm
// this route exists and just isn't for them.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  if (!isAdminEmail(user.email)) notFound()

  return (
    <div style={{ display: 'flex', height: '100vh', background: SNOW, fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}>
      <aside style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '20px 12px', background: '#fff', borderRight: `1px solid ${BORDER}` }}>
        <Link href="/admin" style={{ padding: '0 10px', marginBottom: 6, display: 'block', textDecoration: 'none' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: INK }}>Link<span style={{ color: R }}>Hub</span></span>
        </Link>
        <p style={{ padding: '0 10px', marginBottom: 24, fontSize: 10, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: R }}>Admin</p>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SideLink href="/admin" label="Resumen" />
          <SideLink href="/admin/users" label="Usuarios" />
          <SideLink href="/admin/pages" label="Páginas" />
        </nav>

        <div style={{ paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: MUTED, textDecoration: 'none', padding: '0 10px' }}>← Volver a mi dashboard</Link>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

function SideLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ display: 'block', padding: '9px 10px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: MUTED, textDecoration: 'none' }}>
      {label}
    </Link>
  )
}
