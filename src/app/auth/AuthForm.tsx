'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AUTH_FAILURE_MESSAGES, isAuthFailure } from '@/lib/authErrors'
import { ArrowRight, CalendarCheck, CreditCard, Mail, MessageCircle, ShieldCheck } from 'lucide-react'

const INK = '#111314'
const BODY = '#3F4346'
const MUTED = '#5B6064'
const LINE = 'rgba(17,19,20,0.12)'
const ACCENT = '#E8150A'
const RESEND_SECONDS = 30

// Supabase messages are English and technical; translate the ones people actually hit.
function friendlyAuthError(message: string, status?: number): string {
  if (status === 429 || /rate limit/i.test(message)) return 'Se han enviado demasiados correos en poco tiempo. Espera unos minutos e inténtalo de nuevo.'
  if (/invalid.*email|email.*invalid/i.test(message)) return 'Revisa la dirección de correo: no parece válida.'
  if (/signups? (not allowed|disabled)/i.test(message)) return 'Ahora mismo no se admiten cuentas nuevas con ese correo.'
  return 'No hemos podido enviar el enlace. Inténtalo de nuevo en unos minutos.'
}

// Shortcut to the inbox for the common providers (a real friction reducer on mobile).
const INBOXES: Record<string, { name: string; url: string }> = {
  'gmail.com': { name: 'Gmail', url: 'https://mail.google.com/' }, 'googlemail.com': { name: 'Gmail', url: 'https://mail.google.com/' },
  'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/' }, 'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/' }, 'live.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/' },
  'yahoo.com': { name: 'Yahoo', url: 'https://mail.yahoo.com/' }, 'yahoo.es': { name: 'Yahoo', url: 'https://mail.yahoo.com/' },
  'icloud.com': { name: 'iCloud', url: 'https://www.icloud.com/mail' },
}

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const failure = searchParams.get('error')
  const failureMessage = isAuthFailure(failure) ? AUTH_FAILURE_MESSAGES[failure] : null

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  async function send(address: string) {
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      })
      if (err) { setError(friendlyAuthError(err.message, err.status)); return }
      setSentTo(address); setCooldown(RESEND_SECONDS)
    } catch {
      // createClient throws when the Supabase URL/key are not configured for this deployment.
      setError('El acceso no está disponible ahora mismo. Inténtalo de nuevo en unos minutos.')
    } finally {
      setLoading(false)
    }
  }

  const inbox = sentTo ? INBOXES[sentTo.split('@')[1]?.toLowerCase() ?? ''] : undefined

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]" style={{ background: '#FAFAF8', fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif", color: INK }}>
      {/* Brand side: only on desktop, so the form stays the first thing on mobile */}
      <aside className="hidden lg:flex flex-col justify-between p-12 xl:p-16" style={{ background: INK, color: '#fff' }}>
        <Link href="/" className="text-[24px] font-bold no-underline" style={{ color: '#fff' }}>Link<span style={{ color: ACCENT }}>Hub</span></Link>
        <div>
          <h2 className="font-bold max-w-[460px]" style={{ fontSize: 'clamp(34px, 3.4vw, 48px)', lineHeight: 1.06, letterSpacing: '-0.035em' }}>
            Tu presencia profesional, sin necesidad de una web
          </h2>
          <ul className="mt-8 grid gap-4" style={{ listStyle: 'none', padding: 0 }}>
            {[
              [CalendarCheck, 'Citas y pedidos que llegan a tu WhatsApp, ya ordenados'],
              [CreditCard, 'Cobra con Mercado Pago, Stripe o Redsys, sin comisión de LinkHub'],
              [MessageCircle, 'Te ayudamos a ponerla en marcha'],
            ].map(([Icon, t]) => {
              const I = Icon as typeof Mail
              return <li key={t as string} className="flex items-start gap-3 text-[16px]" style={{ color: 'rgba(255,255,255,.85)' }}><I size={20} aria-hidden className="mt-0.5 flex-shrink-0" />{t as string}</li>
            })}
          </ul>
        </div>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,.55)' }}>Para autónomos y profesionales en España y Latinoamérica.</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full" style={{ maxWidth: 400 }}>
          <Link href="/" className="lg:hidden block text-center text-[24px] font-bold no-underline mb-8" style={{ color: INK }}>Link<span style={{ color: ACCENT }}>Hub</span></Link>

          {sentTo ? (
            <div role="status" aria-live="polite">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#fff', border: `1px solid ${LINE}` }}><Mail size={26} aria-hidden /></span>
              <h1 className="mt-6 font-bold" style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.03em' }}>Revisa tu correo</h1>
              <p className="mt-3 text-[16px] leading-relaxed" style={{ color: BODY }}>Te hemos enviado un enlace de acceso a <strong style={{ color: INK }}>{sentTo}</strong>. Ábrelo en este mismo navegador y entrarás directamente.</p>
              {inbox && (
                <a href={inbox.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-white no-underline" style={{ height: 52, background: INK }}>
                  Abrir {inbox.name} <ArrowRight size={17} aria-hidden />
                </a>
              )}
              <ol className="mt-6 grid gap-2.5 text-[14.5px]" style={{ color: BODY, paddingLeft: 20 }}>
                <li>Busca un mensaje de LinkHub (mira también en spam o promociones).</li>
                <li>Pulsa el botón «Acceder a LinkHub».</li>
                <li>El enlace caduca pronto y solo funciona una vez.</li>
              </ol>
              {error && <p role="alert" className="mt-4 text-[14px]" style={{ color: '#B50F07' }}>{error}</p>}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
                <button type="button" onClick={() => send(sentTo)} disabled={cooldown > 0 || loading} className="underline" style={{ background: 'none', border: 0, padding: 0, minHeight: 44, color: cooldown > 0 ? MUTED : INK, cursor: cooldown > 0 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                  {cooldown > 0 ? `Reenviar en ${cooldown} s` : loading ? 'Enviando…' : 'Reenviar el enlace'}
                </button>
                <button type="button" onClick={() => { setSentTo(null); setError(null) }} className="underline" style={{ background: 'none', border: 0, padding: 0, minHeight: 44, color: INK, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Usar otro correo</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-bold" style={{ fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.03em' }}>Entra a LinkHub</h1>
              <p className="mt-3 text-[16px] leading-relaxed" style={{ color: BODY }}>Sin contraseña: te enviamos un enlace de acceso. Si aún no tienes cuenta, se crea al entrar.</p>

              {failureMessage && (
                <p role="alert" className="mt-5 rounded-xl p-3.5 text-[14px] leading-relaxed" style={{ background: '#FEF0EF', color: '#B50F07' }}>{failureMessage}</p>
              )}

              <form onSubmit={e => { e.preventDefault(); send(email.trim()) }} className="mt-7" noValidate={false}>
                <label htmlFor="email" className="block text-[14px] font-semibold mb-2">Correo electrónico</label>
                <input id="email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} autoFocus placeholder="tu@correo.com"
                  aria-invalid={error ? true : undefined} aria-describedby={error ? 'auth-error' : undefined}
                  className="w-full rounded-xl px-4 text-[16px] outline-none bg-white focus:border-[#111314]" style={{ height: 54, border: `1.5px solid ${error ? '#B50F07' : LINE}`, color: INK }} />
                {error && <p id="auth-error" role="alert" className="mt-2 text-[14px]" style={{ color: '#B50F07' }}>{error}</p>}
                <button type="submit" disabled={loading || !email.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-white"
                  style={{ height: 54, background: ACCENT, border: 0, cursor: loading ? 'wait' : 'pointer', opacity: loading || !email.trim() ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {loading ? 'Enviando…' : <>Enviar enlace de acceso <ArrowRight size={17} aria-hidden /></>}
                </button>
              </form>

              <p className="mt-6 flex items-start gap-2 text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                <ShieldCheck size={16} aria-hidden className="mt-0.5 flex-shrink-0" />
                Es más seguro que una contraseña: nadie puede adivinarla ni reutilizarla.
              </p>
              <p className="mt-6 text-[13px] leading-relaxed" style={{ color: MUTED }}>
                Al continuar aceptas los <Link href="/legal/terminos" className="underline">términos</Link> y la <Link href="/legal/privacidad" className="underline">política de privacidad</Link>.
              </p>
            </>
          )}

          <p className="mt-10 text-[13px]"><Link href="/" className="underline" style={{ color: MUTED }}>← Volver al inicio</Link></p>
        </div>
      </main>
    </div>
  )
}
