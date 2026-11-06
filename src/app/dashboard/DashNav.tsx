'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { LayoutDashboard, BarChart3, Users, Sparkles, Settings, ShieldCheck, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { SignOutButton } from './SignOutButton'

const R = '#E8150A'
const INK = '#1A1B1C'
// #6B6E71 on white is 5.2:1 (AA for small text); the old #6B6E71 was 2.8:1.
const SUB = '#6B6E71'

interface Item { href: string; label: string; hint: string; icon: typeof LayoutDashboard; exact?: boolean }

const SECTIONS: { title: string; items: Item[] }[] = [
  { title: 'Gestión', items: [
    { href: '/dashboard', label: 'Resumen', hint: 'Tus páginas y métricas', icon: LayoutDashboard, exact: true },
  ] },
  { title: 'Crecimiento', items: [
    { href: '/dashboard/analytics', label: 'Analíticas', hint: 'Visitas y clics', icon: BarChart3 },
    { href: '/dashboard/contacts', label: 'Contactos', hint: 'Emails capturados', icon: Users },
  ] },
  { title: 'Cuenta', items: [
    { href: '/dashboard/upgrade', label: 'Planes', hint: 'Tu suscripción', icon: Sparkles },
    { href: '/dashboard/settings', label: 'Ajustes', hint: 'Pagos y conexiones', icon: Settings },
  ] },
]
const MOBILE_ITEMS = SECTIONS.flatMap(s => s.items)

// Collapsed/expanded preference, remembered per browser. External-store
// pattern: the server (and first paint) always renders expanded.
const KEY = 'lh-dash-collapsed'
const subscribe = (cb: () => void) => { window.addEventListener('lh-dash-collapse', cb); return () => window.removeEventListener('lh-dash-collapse', cb) }
const read = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
function setCollapsed(v: boolean) {
  try { localStorage.setItem(KEY, v ? '1' : '0') } catch { /* storage blocked: preference just won't persist */ }
  window.dispatchEvent(new Event('lh-dash-collapse'))
}

interface Props { name: string; initial: string; plan: string; isAdmin: boolean }

export function DashNav({ name, initial, plan, isAdmin }: Props) {
  const pathname = usePathname()
  const collapsed = useSyncExternalStore(subscribe, read, () => false)
  const active = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + '/'))

  const link = (it: Item) => {
    const on = active(it.href, it.exact)
    const Icon = it.icon
    return (
      <Link key={it.href} href={it.href} aria-current={on ? 'page' : undefined} title={collapsed ? it.label : undefined}
        className="dash-link group relative flex items-center gap-3 rounded-xl no-underline transition-colors hover:bg-[#F2F3F4] min-h-[44px]"
        style={{ padding: collapsed ? '10px 0' : '8px 12px', justifyContent: collapsed ? 'center' : undefined, background: on ? '#FEF0EF' : undefined }}>
        {on && <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: R }} />}
        <Icon size={19} strokeWidth={on ? 2.4 : 2} color={on ? R : '#4A4D50'} aria-hidden />
        {collapsed ? <span className="sr-only">{it.label}</span> : (
          <span className="min-w-0 leading-tight">
            <span className="block text-[14px] font-semibold" style={{ color: on ? R : INK }}>{it.label}</span>
            <span className="block text-[11.5px] truncate" style={{ color: SUB }}>{it.hint}</span>
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 flex-col bg-white border-r px-3 py-5 sticky top-0 h-screen transition-[width] duration-200"
        style={{ width: collapsed ? 76 : 256, borderColor: 'rgba(26,27,28,0.08)' }}>
        <div className="flex items-center justify-between mb-6 px-1.5" style={{ flexDirection: collapsed ? 'column' : 'row', gap: collapsed ? 12 : 0 }}>
          <Link href="/dashboard" className="dash-link text-[19px] font-bold no-underline rounded-lg px-1.5" style={{ color: INK }} aria-label="LinkHub, ir al resumen">
            {collapsed ? <span>L<span style={{ color: R }}>H</span></span> : <>Link<span style={{ color: R }}>Hub</span></>}
          </Link>
          <button onClick={() => setCollapsed(!collapsed)} aria-pressed={collapsed} aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'} title={collapsed ? 'Expandir menú' : 'Contraer menú'}
            className="dash-link w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F2F3F4]" style={{ color: '#4A4D50' }}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto -mx-1 px-1" aria-label="Menú principal del panel">
          {SECTIONS.map(sec => (
            <div key={sec.title} className="mb-4">
              {collapsed
                ? <div className="mx-3 mb-2 h-px" style={{ background: 'rgba(26,27,28,0.08)' }} aria-hidden />
                : <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: SUB }}>{sec.title}</p>}
              <div className="flex flex-col gap-0.5">{sec.items.map(link)}</div>
            </div>
          ))}
          {isAdmin && (
            <div className="flex flex-col gap-0.5">
              {link({ href: '/admin', label: 'Administración', hint: 'Panel interno', icon: ShieldCheck })}
            </div>
          )}
        </nav>

        {plan !== 'pro' && !collapsed && (
          <Link href="/dashboard/upgrade" className="dash-link block rounded-2xl p-3.5 mb-3 no-underline" style={{ background: 'linear-gradient(135deg,#1A1B1C,#3a1512)', color: '#fff' }}>
            <p className="text-[13px] font-bold">Pasate a Pro</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,.78)' }}>Todos los bloques, analíticas completas y más.</p>
          </Link>
        )}

        <div className="pt-3 border-t" style={{ borderColor: 'rgba(26,27,28,0.08)' }}>
          <Link href="/dashboard/settings" className="dash-link flex items-center gap-2.5 rounded-xl px-2 py-1.5 mb-1 no-underline hover:bg-[#F2F3F4]" style={{ justifyContent: collapsed ? 'center' : undefined }} title={collapsed ? name : undefined}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: R }} aria-hidden>{initial}</span>
            {collapsed ? <span className="sr-only">{name}, plan {plan}</span> : (
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold truncate" style={{ color: INK }}>{name}</span>
                <span className="block text-[11px] font-bold uppercase tracking-wide" style={{ color: plan === 'pro' ? R : SUB }}>Plan {plan}</span>
              </span>
            )}
          </Link>
          {!collapsed && <SignOutButton />}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 bg-white/95 backdrop-blur border-b" style={{ borderColor: 'rgba(26,27,28,0.08)' }}>
        <Link href="/dashboard" className="dash-link text-[18px] font-bold no-underline" style={{ color: INK }}>Link<span style={{ color: R }}>Hub</span></Link>
        <Link href="/dashboard/settings" className="dash-link w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: R }} aria-label={`Cuenta de ${name}`}>{initial}</Link>
      </header>

      {/* Mobile bottom tabs: 5 targets of ≥48px, labels always visible */}
      <nav aria-label="Menú principal del panel" className="lg:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 bg-white border-t pb-[env(safe-area-inset-bottom)]" style={{ borderColor: 'rgba(26,27,28,0.08)' }}>
        {MOBILE_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const on = active(href, exact)
          return (
            <Link key={href} href={href} aria-current={on ? 'page' : undefined} className="dash-link relative flex flex-col items-center justify-center gap-1 min-h-[56px] text-[11px] font-semibold no-underline"
              style={{ color: on ? R : '#4A4D50' }}>
              {on && <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-b-full" style={{ background: R }} />}
              <Icon size={20} strokeWidth={on ? 2.4 : 2} aria-hidden />{label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
