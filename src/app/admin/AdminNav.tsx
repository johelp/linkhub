'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, FileText, CreditCard, ToggleRight, ScrollText, Activity, ArrowLeft } from 'lucide-react'

const R = '#E8150A'
const ITEMS = [
  { href: '/admin', label: 'Resumen', hint: 'Estado del negocio', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Clientes', hint: 'Cuentas y planes', icon: Users },
  { href: '/admin/pages', label: 'Páginas', hint: 'Moderación', icon: FileText },
  { href: '/admin/payments', label: 'Cobros', hint: 'Pagos y eventos', icon: CreditCard },
  { href: '/admin/features', label: 'Funciones', hint: 'Despliegue gradual', icon: ToggleRight },
  { href: '/admin/audit', label: 'Auditoría', hint: 'Quién hizo qué', icon: ScrollText },
  { href: '/admin/system', label: 'Sistema', hint: 'Salud y configuración', icon: Activity },
]

export function AdminNav({ email, env }: { email: string; env: string }) {
  const pathname = usePathname()
  const on = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + '/'))
  return (
    <>
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-white border-r px-3 py-5 sticky top-0 h-screen" style={{ borderColor: 'rgba(26,27,28,0.08)' }}>
        <div className="px-3 mb-6">
          <Link href="/admin" className="text-[19px] font-bold text-[#1A1B1C] no-underline dash-link">Link<span style={{ color: R }}>Hub</span></Link>
          <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[.1em]" style={{ color: R }}>Administración · {env}</p>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5" aria-label="Menú de administración">
          {ITEMS.map(({ href, label, hint, icon: Icon, exact }) => {
            const active = on(href, exact)
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined} className="dash-link relative flex items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] no-underline hover:bg-[#F2F3F4]" style={{ background: active ? '#FEF0EF' : undefined }}>
                {active && <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: R }} />}
                <Icon size={18} strokeWidth={active ? 2.4 : 2} color={active ? R : '#4A4D50'} aria-hidden />
                <span className="leading-tight"><span className="block text-[14px] font-semibold" style={{ color: active ? R : '#1A1B1C' }}>{label}</span><span className="block text-[11.5px] text-[#6B6E71]">{hint}</span></span>
              </Link>
            )
          })}
        </nav>
        <div className="pt-3 border-t text-[12px]" style={{ borderColor: 'rgba(26,27,28,0.08)' }}>
          <p className="px-2 mb-2 text-[#6B6E71] truncate">{email}</p>
          <Link href="/dashboard" className="dash-link flex items-center gap-2 px-2 py-2 rounded-lg no-underline text-[#3A3D40] hover:bg-[#F2F3F4]"><ArrowLeft size={14} />Volver a mi dashboard</Link>
        </div>
      </aside>

      <header className="lg:hidden fixed top-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-b" style={{ borderColor: 'rgba(26,27,28,0.08)' }}>
        <div className="h-12 flex items-center justify-between px-4">
          <Link href="/admin" className="text-[17px] font-bold text-[#1A1B1C] no-underline">Link<span style={{ color: R }}>Hub</span> <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: R }}>Admin · {env}</span></Link>
          <Link href="/dashboard" className="text-xs font-semibold text-[#3A3D40] no-underline">Mi panel</Link>
        </div>
        <nav aria-label="Menú de administración" className="flex gap-1.5 overflow-x-auto px-3 pb-2">
          {ITEMS.map(({ href, label, exact }) => (
            <Link key={href} href={href} aria-current={on(href, exact) ? 'page' : undefined} className="px-3.5 py-2 rounded-full text-[13px] font-semibold no-underline whitespace-nowrap"
              style={{ background: on(href, exact) ? '#1A1B1C' : '#F2F3F4', color: on(href, exact) ? '#fff' : '#3A3D40' }}>{label}</Link>
          ))}
        </nav>
      </header>
    </>
  )
}
