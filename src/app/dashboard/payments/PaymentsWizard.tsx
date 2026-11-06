'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Check, ExternalLink, ShieldCheck, MessageCircle, CreditCard, Lock, AlertTriangle, PartyPopper, Loader2, Eye, EyeOff } from 'lucide-react'
import { computeSteps, type PaymentsStatus, type StepState } from '@/lib/payments'
import { PROVIDERS, PROVIDER_BY_ID } from '@/lib/payments/meta'
import type { PaymentProvider } from '@/types'
import { formatDate } from '@/lib/utils'

const INK = '#1A1B1C'
const card = { border: '1px solid rgba(26,27,28,0.08)' }

const RESULT: Record<string, { tone: 'ok' | 'warn' | 'err'; title: string; text: string }> = {
  connected: { tone: 'ok', title: '¡Cuenta conectada!', text: 'Ya podés cobrar. Seguí con el paso siguiente.' },
  error: { tone: 'err', title: 'No pudimos conectar tu cuenta', text: 'Suele pasar si cerraste la ventana del proveedor o no aceptaste los permisos. Probá de nuevo desde el paso 1.' },
  not_configured: { tone: 'warn', title: 'Esta pasarela todavía no está activada', text: 'La plataforma aún no tiene activada esta conexión. Escribinos y lo resolvemos.' },
}

interface Props { status: PaymentsStatus; result: string | null; resultProvider: string | null; enabledProviders: string[]; isAdmin: boolean; isPro: boolean }

export function PaymentsWizard({ status, result, resultProvider, enabledProviders, isAdmin, isPro }: Props) {
  const states = computeSteps(status)
  const doneCount = states.filter(s => s === 'done').length
  const allDone = doneCount === 3
  const msg = result ? RESULT[result] : null
  const firstPage = status.pages.find(p => p.paymentBlocks === 0) ?? status.pages[0]
  const visible = PROVIDERS.filter(p => enabledProviders.includes(p.id) || status.providers[p.id].connected)
  const initial = (visible.find(p => p.id === resultProvider)?.id ?? status.connectedProviders[0] ?? visible[0]?.id ?? 'mercadopago') as PaymentProvider
  const [selected, setSelected] = useState<PaymentProvider>(initial)

  return (
    <div className="space-y-4">
      {msg && (
        <div role="status" className="rounded-2xl p-4 flex gap-3" style={{ background: msg.tone === 'ok' ? '#ECFDF3' : msg.tone === 'err' ? '#FEF0EF' : '#FFF7ED', border: `1px solid ${msg.tone === 'ok' ? '#BBF7D0' : msg.tone === 'err' ? '#F6C6C3' : '#FED7AA'}` }}>
          {msg.tone === 'ok' ? <PartyPopper size={20} color="#15803D" /> : <AlertTriangle size={20} color={msg.tone === 'err' ? '#B91C1C' : '#9A3412'} />}
          <div><p className="text-sm font-bold" style={{ color: INK }}>{msg.title}</p><p className="text-[13px] text-[#5A5D60] mt-0.5">{msg.text}</p></div>
        </div>
      )}

      <section className="rounded-2xl p-5 bg-white" style={card} aria-labelledby="no-gateway">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ECFDF3', color: '#15803D' }}><MessageCircle size={18} /></span>
          <div>
            <h2 id="no-gateway" className="text-[15px] font-bold" style={{ color: INK }}>¿Preferís cobrar en persona o por WhatsApp?</h2>
            <p className="text-[13px] text-[#5A5D60] mt-1">Los bloques <b>Pedidos</b> y <b>Solicitud de citas</b> no necesitan pasarela: el cliente te escribe por WhatsApp y cobrás como siempre. Seguí solo si querés que paguen online.</p>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-2 rounded-full bg-[#E5E7EB] overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${(doneCount / 3) * 100}%`, background: allDone ? '#16A34A' : '#1A1B1C' }} /></div>
        <span className="text-xs font-semibold text-[#5A5D60]" aria-live="polite">{doneCount} de 3 pasos</span>
      </div>

      <Step n={1} state={states[0]} title="Elegí cómo cobrar y conectá tu cuenta"
        summary={status.connectedProviders.length ? `Conectado: ${status.connectedProviders.map(id => PROVIDER_BY_ID[id].name.split(' (')[0]).join(', ')}` : 'Elegí la pasarela que mejor se adapte a tu país y a tu banco.'}>
        <div role="radiogroup" aria-label="Pasarela de cobro" className="grid sm:grid-cols-3 gap-2.5 mb-4">
          {visible.map(p => {
            const st = status.providers[p.id]
            const on = selected === p.id
            return (
              <button key={p.id} role="radio" aria-checked={on} onClick={() => setSelected(p.id)}
                className="text-left rounded-xl p-3.5 transition-all bg-white" style={{ border: `2px solid ${on ? p.color : 'rgba(26,27,28,0.1)'}`, boxShadow: on ? `0 0 0 3px ${p.color}1f` : 'none' }}>
                <span className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
                  {st.connected && <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#ECFDF3', color: '#15803D' }}>● Conectado</span>}
                </span>
                <span className="block text-[14px] font-bold" style={{ color: INK }}>{p.name}</span>
                <span className="block text-xs text-[#5A5D60] mt-0.5 leading-snug">{p.tagline}</span>
                <span className="block text-[11px] font-semibold mt-1.5" style={{ color: p.color }}>{p.region}</span>
              </button>
            )
          })}
        </div>
        <Connect provider={selected} status={status} isAdmin={isAdmin} />
      </Step>

      <Step n={2} state={states[1]} locked={status.connectedProviders.length === 0} title="Agregá un botón de cobro a tu página"
        summary={status.hasPaymentBlock ? 'Ya tenés un bloque de cobro en una de tus páginas.' : 'Elegí qué vas a vender: un producto o entradas a un evento.'}>
        {status.pages.length === 0 ? (
          <p className="text-[13.5px] text-[#5A5D60]">Primero creá una página desde <Link href="/dashboard" className="underline font-semibold">Resumen</Link>.</p>
        ) : (
          <div className="space-y-3">
            {!isPro && <p className="text-[13px] rounded-xl p-3" style={{ background: '#FEF0EF', color: '#B50F07' }}><Lock size={13} className="inline mr-1" />Los bloques de cobro son parte del plan Pro. <Link href="/dashboard/upgrade" className="underline font-semibold">Ver Pro</Link></p>}
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { type: 'payment_button', icon: '💳', title: 'Botón de pago', desc: 'Para un producto, servicio o seña con precio fijo.' },
                { type: 'event_tickets', icon: '🎟️', title: 'Entradas a evento', desc: 'Hasta 3 tipos de entrada, con QR para la puerta.' },
              ].map(o => (
                <Link key={o.type} href={firstPage ? `/editor/${firstPage.id}?add=${o.type}` : '/dashboard'}
                  className="rounded-xl p-4 no-underline block bg-white hover:shadow-md transition-shadow" style={{ ...card, opacity: status.connectedProviders.length ? 1 : 0.55, pointerEvents: status.connectedProviders.length ? 'auto' : 'none' }}>
                  <p className="text-2xl mb-1.5" aria-hidden>{o.icon}</p>
                  <p className="text-[14px] font-bold" style={{ color: INK }}>{o.title}</p>
                  <p className="text-xs text-[#5A5D60] mt-0.5">{o.desc}</p>
                  <p className="text-xs font-semibold mt-2.5" style={{ color: '#0077AD' }}>Agregar en “{firstPage?.name}” →</p>
                </Link>
              ))}
            </div>
            <p className="text-xs text-[#5A5D60]">{status.connectedProviders.length > 1 ? 'Tenés varias pasarelas: en el editor elegís con cuál cobra cada botón (o dejás “Automática”).' : 'Se agrega a tu página más reciente; podés moverlo después desde el editor.'}</p>
          </div>
        )}
      </Step>

      <Step n={3} state={states[2]} locked={!status.hasPaymentBlock} title="Publicá y hacé una prueba"
        summary={status.hasPublishedPaymentPage ? '¡Tu página ya cobra!' : 'Una página en borrador no puede cobrar: publicala y probá con un pago chico.'}>
        <ul className="space-y-2 text-[13.5px] mb-3">
          {status.pages.filter(p => p.paymentBlocks > 0).map(p => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl p-3" style={card}>
              <span className="min-w-0"><b className="block truncate" style={{ color: INK }}>{p.name}</b><span className="text-xs" style={{ color: p.published ? '#15803D' : '#B45309' }}>{p.published ? '● En vivo' : '○ Sin publicar'}</span></span>
              <Link href={`/editor/${p.id}`} className="text-[13px] font-semibold no-underline flex-shrink-0" style={{ color: '#0077AD' }}>{p.published ? 'Abrir editor' : 'Publicar →'}</Link>
            </li>
          ))}
        </ul>
        <div className="rounded-xl p-3.5 text-[13px] text-[#3A3D40]" style={{ background: '#F6F6F5' }}>
          <p className="font-bold mb-1">Cómo probar</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Abrí tu página pública desde otro navegador o el celular.</li>
            <li>Tocá el botón de pago y completá una compra de monto bajo.</li>
            <li>Verificá que el pago aparezca abajo, en “Cobros recientes”.</li>
          </ol>
          {status.connectedProviders.some(id => status.providers[id].liveMode === false) && <p className="mt-2 font-semibold" style={{ color: '#9A3412' }}>Alguna de tus cuentas está en modo de prueba: esos pagos no son reales.</p>}
        </div>
      </Step>

      {allDone && (
        <div className="rounded-2xl p-5 text-center" style={{ background: '#ECFDF3', border: '1px solid #BBF7D0' }}>
          <p className="text-2xl mb-1" aria-hidden>🎉</p>
          <p className="text-[15px] font-bold" style={{ color: INK }}>Todo listo: tu página puede cobrar</p>
          <p className="text-[13px] text-[#3A3D40] mt-1">Compartí tu enlace o tu QR y empezá a vender.</p>
        </div>
      )}

      {status.recent.length > 0 && (
        <section className="rounded-2xl bg-white overflow-hidden" style={card} aria-labelledby="recent-h">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 id="recent-h" className="text-[15px] font-bold" style={{ color: INK }}>Cobros recientes</h2>
            <Link href="/dashboard/payments/history" className="text-[13px] font-semibold no-underline" style={{ color: '#0077AD' }}>Ver historial completo →</Link>
          </div>
          <ul>
            {status.recent.map(p => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3 border-t text-[13px]" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
                <span className="min-w-0 flex-1"><b className="block truncate" style={{ color: INK }}>{p.tier_name ?? 'Pago'}</b><span className="text-xs text-[#5A5D60] truncate block">{p.payer_email ?? 'Comprador'} · {PROVIDER_BY_ID[p.provider as PaymentProvider]?.name.split(' (')[0] ?? p.provider} · {formatDate(p.created_at)}</span></span>
                <span className="tabular-nums font-semibold">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: p.currency }).format(p.amount)}</span>
                <StatusPill s={p.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {status.recent.length === 0 && <p className="text-xs px-1"><Link href="/dashboard/payments/history" className="font-semibold underline text-[#0077AD]">Historial de cobros</Link></p>}
      <p className="text-xs text-[#5A5D60] px-1 pt-1">El dinero va directo a tu cuenta según los plazos de tu proveedor o banco. LinkHub no retiene fondos ni los toca.</p>
    </div>
  )
}

// ─── Provider-specific connect panel ─────────────────────────────
function Connect({ provider, status, isAdmin }: { provider: PaymentProvider; status: PaymentsStatus; isAdmin: boolean }) {
  const meta = PROVIDER_BY_ID[provider]
  const st = status.providers[provider]
  if (st.connected) return <Connected provider={provider} status={status} />

  if (provider === 'redsys') return <RedsysForm />

  const href = provider === 'stripe' ? '/api/connect/stripe/start' : '/api/connect/mercadopago/start'
  const signup = provider === 'stripe' ? 'https://dashboard.stripe.com/register' : 'https://www.mercadopago.com.ar/hub/registration/landing'
  const label = provider === 'stripe' ? 'Stripe' : 'Mercado Pago'
  return (
    <div>
      <ol className="space-y-2.5 text-[13.5px] text-[#3A3D40] mb-4">
        <li className="flex gap-2.5"><Num n="a" />Necesitás una cuenta de {label}{provider === 'mercadopago' ? ' de vendedor' : ''}. Si no tenés, <a className="underline font-semibold" style={{ color: meta.color }} href={signup} target="_blank" rel="noopener noreferrer">creala acá <ExternalLink size={11} className="inline" /></a>.</li>
        <li className="flex gap-2.5"><Num n="b" />Tocá el botón. Se abre {label} en esta misma pestaña.</li>
        <li className="flex gap-2.5"><Num n="c" />Iniciá sesión y aceptá los permisos. Volvés acá automáticamente.</li>
      </ol>
      {st.serverReady ? (
        <a href={href} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-[15px] font-bold text-white no-underline w-full sm:w-auto" style={{ background: meta.color }}>
          <CreditCard size={17} /> Conectar {label}
        </a>
      ) : (
        <div className="rounded-xl p-3.5 text-[13px]" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>
          <p className="font-semibold">{label} todavía no está activado en la plataforma.</p>
          <p className="mt-0.5">{isAdmin
            ? (provider === 'stripe' ? <>Sos administrador: falta <code>STRIPE_SECRET_KEY</code> y <code>STRIPE_CONNECT_CLIENT_ID</code> en Vercel (ver SETUP.md).</> : <>Sos administrador: falta <code>MERCADOPAGO_CLIENT_ID</code> y <code>MERCADOPAGO_CLIENT_SECRET</code> en Vercel (ver SETUP.md §7).</>)
            : 'Escribinos y lo activamos para vos. Mientras tanto podés usar otra pasarela.'}</p>
        </div>
      )}
      <p className="flex items-start gap-2 text-xs text-[#5A5D60] mt-3.5"><ShieldCheck size={14} className="flex-shrink-0 mt-px" color="#15803D" />Nunca vemos tu contraseña. Recibimos un permiso que podés quitar cuando quieras desde {label}.</p>
    </div>
  )
}

function RedsysForm() {
  const router = useRouter()
  const [f, setF] = useState({ merchantCode: '', terminal: '1', secret: '', environment: 'test' as 'test' | 'live' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = 'w-full px-3.5 py-3 rounded-xl text-[15px] outline-none bg-white'
  const ring = { border: '1.5px solid rgba(26,27,28,0.14)' }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    const res = await fetch('/api/connect/redsys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(body.error ?? 'No se pudo guardar'); return }
    toast.success('Redsys conectado')
    router.push('/dashboard/payments?result=connected&provider=redsys')
    router.refresh()
  }

  return (
    <form onSubmit={save} className="space-y-3.5">
      <div className="rounded-xl p-3.5 text-[13px] text-[#3A3D40]" style={{ background: '#F6F6F5' }}>
        <p className="font-bold mb-1">¿Dónde consigo estos datos?</p>
        <p>Los entrega <b>tu banco</b> al contratar el TPV virtual (Redsys): un <b>código de comercio</b> (FUC), el <b>terminal</b> y una <b>clave secreta</b> (SHA-256). Si todavía estás tramitando la cuenta, el banco te da datos de <b>pruebas</b>: usá el entorno “Pruebas” hasta que te habiliten producción.</p>
      </div>
      <label className="block"><span className="block text-[13px] font-semibold mb-1.5 text-[#3A3D40]">Código de comercio (FUC)</span>
        <input className={input} style={ring} inputMode="numeric" autoComplete="off" required value={f.merchantCode} onChange={e => setF({ ...f, merchantCode: e.target.value })} placeholder="Ej: 999008881" /></label>
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <label className="block"><span className="block text-[13px] font-semibold mb-1.5 text-[#3A3D40]">Terminal</span>
          <input className={input} style={ring} inputMode="numeric" required value={f.terminal} onChange={e => setF({ ...f, terminal: e.target.value })} /></label>
        <label className="block"><span className="block text-[13px] font-semibold mb-1.5 text-[#3A3D40]">Clave secreta</span>
          <span className="relative block">
            <input className={`${input} pr-11`} style={ring} type={show ? 'text' : 'password'} autoComplete="off" required value={f.secret} onChange={e => setF({ ...f, secret: e.target.value })} placeholder="32 caracteres" />
            <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Ocultar clave' : 'Mostrar clave'} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#5A5D60]">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </span></label>
      </div>
      <fieldset>
        <legend className="text-[13px] font-semibold mb-1.5 text-[#3A3D40]">Entorno</legend>
        <div className="grid grid-cols-2 gap-2">
          {([['test', 'Pruebas', 'Sin dinero real'], ['live', 'Producción', 'Cobros reales']] as const).map(([v, l, d]) => (
            <label key={v} className="rounded-xl p-3 cursor-pointer" style={{ border: `2px solid ${f.environment === v ? '#C8102E' : 'rgba(26,27,28,0.1)'}`, background: '#fff' }}>
              <input type="radio" name="env" className="sr-only" checked={f.environment === v} onChange={() => setF({ ...f, environment: v })} />
              <span className="block text-[14px] font-bold" style={{ color: INK }}>{l}</span><span className="block text-xs text-[#5A5D60]">{d}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-[13px] font-semibold" style={{ color: '#B91C1C' }}>{error}</p>}
      <button disabled={busy} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-[15px] font-bold text-white w-full sm:w-auto disabled:opacity-60" style={{ background: '#C8102E' }}>
        {busy && <Loader2 size={16} className="animate-spin" />}Guardar y conectar
      </button>
      <p className="flex items-start gap-2 text-xs text-[#5A5D60]"><ShieldCheck size={14} className="flex-shrink-0 mt-px" color="#15803D" />Tu clave se guarda cifrada y no se vuelve a mostrar. Podés desconectar cuando quieras.</p>
    </form>
  )
}

function Connected({ provider, status }: { provider: PaymentProvider; status: PaymentsStatus }) {
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const st = status.providers[provider]
  const meta = PROVIDER_BY_ID[provider]
  async function disconnect() {
    if (!window.confirm(`¿Desconectar ${meta.name}? Tus botones de cobro con esta pasarela dejarán de funcionar hasta que vuelvas a conectarla.`)) return
    setBusy(true)
    const res = await fetch('/api/connect/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider }) })
    setBusy(false)
    if (!res.ok) { toast.error('No se pudo desconectar'); return }
    toast.success(`${meta.name} desconectado`)
    router.refresh()
  }
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: '#F8FBF9', border: '1px solid #D1FAE5' }}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#ECFDF3', color: '#15803D' }}>● {meta.name.split(' (')[0]} conectado</span>
        {st.liveMode === false && <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#FFF7ED', color: '#9A3412' }}>Modo de prueba</span>}
        <button onClick={disconnect} disabled={busy} className="text-xs font-semibold underline text-[#5A5D60] disabled:opacity-50 ml-auto">{busy ? 'Desconectando…' : 'Desconectar'}</button>
      </div>
      <p className="text-xs text-[#5A5D60]">{st.detail ? `${st.detail} · ` : ''}Conectado el {formatDate(st.connectedAt)}</p>
      {st.liveMode === false && <p className="text-xs" style={{ color: '#9A3412' }}>En modo de prueba los pagos no son reales. {provider === 'redsys' ? 'Cuando tu banco te habilite producción, desconectá y volvé a conectar con los datos reales.' : ''}</p>}
    </div>
  )
}

function Step({ n, state, locked, title, summary, children }: { n: number; state: StepState; locked?: boolean; title: string; summary: string; children: React.ReactNode }) {
  const done = state === 'done'
  const open = !locked
  return (
    <section className="rounded-2xl bg-white p-5" style={{ ...card, borderColor: state === 'current' ? INK : undefined, boxShadow: state === 'current' ? '0 0 0 3px rgba(26,27,28,0.08)' : undefined, opacity: locked ? 0.7 : 1 }} aria-labelledby={`step-${n}`}>
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ background: done ? '#16A34A' : state === 'current' ? INK : '#C7C9CB' }} aria-hidden>{done ? <Check size={16} strokeWidth={3} /> : n}</span>
        <div className="min-w-0 flex-1">
          <h2 id={`step-${n}`} className="text-[15px] font-bold" style={{ color: INK }}>
            <span className="sr-only">Paso {n}: </span>{title}
            {done && <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full align-middle" style={{ background: '#ECFDF3', color: '#15803D' }}>Hecho</span>}
            {locked && <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full align-middle bg-[#F2F3F4] text-[#5A5D60]">Primero el paso anterior</span>}
          </h2>
          <p className="text-[13px] text-[#5A5D60] mt-0.5">{summary}</p>
          {open && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </section>
  )
}

function Num({ n }: { n: string }) {
  return <span className="w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#E6F5FC', color: '#0077AD' }} aria-hidden>{n}</span>
}

function StatusPill({ s }: { s: string }) {
  const m: Record<string, [string, string, string]> = { approved: ['Aprobado', '#ECFDF3', '#15803D'], pending: ['Pendiente', '#FFF7ED', '#9A3412'], rejected: ['Rechazado', '#FEF0EF', '#B91C1C'], refunded: ['Devuelto', '#F2F3F4', '#5A5D60'] }
  const [l, bg, c] = m[s] ?? [s, '#F2F3F4', '#5A5D60']
  return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: bg, color: c }}>{l}</span>
}
