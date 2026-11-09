'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AUTH_FAILURE_MESSAGES, isAuthFailure } from '@/lib/authErrors'
import { safeNextPath } from '@/lib/security'
import { ArrowRight, CalendarCheck, CreditCard, Mail, MessageCircle, ShieldCheck } from 'lucide-react'

const INK = '#111314'
const BODY = '#3F4346'
const MUTED = '#5B6064'
const LINE = 'rgba(17,19,20,0.12)'
const ACCENT = '#E8150A'
const RESEND_SECONDS = 30
const CODE_LENGTH = 6   // Supabase → Authentication → Providers → Email → "Email OTP Length" must match

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

function friendlyCodeError(message: string): string {
  if (/expired|invalid/i.test(message)) return 'Ese código no es válido o ha caducado. Revisa los dígitos o pide uno nuevo.'
  return 'No hemos podido comprobar el código. Inténtalo de nuevo.'
}

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const failure = searchParams.get('error')
  const failureMessage = isAuthFailure(failure) ? AUTH_FAILURE_MESSAGES[failure] : null

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  // If the link is opened in another tab of THIS browser, the session appears
  // here too: take the user in instead of leaving this tab waiting.
  useEffect(() => {
    if (!sentTo) return
    try {
      const { data } = createClient().auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) window.location.assign(safeNextPath(next))
      })
      return () => data.subscription.unsubscribe()
    } catch { /* not configured: nothing to listen to */ }
  }, [sentTo, next])

  async function verify(token: string) {
    if (!sentTo || verifying) return
    setVerifying(true); setError(null)
    try {
      const { error: err } = await createClient().auth.verifyOtp({ email: sentTo, token, type: 'email' })
      if (err) { setError(friendlyCodeError(err.message)); setCode(''); return }
      window.location.assign(safeNextPath(next))   // full load: the server reads the new session cookie
    } catch {
      setError('El acceso no está disponible ahora mismo. Inténtalo de nuevo en unos minutos.')
    } finally {
      setVerifying(false)
    }
  }

  async function send(address: string) {
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      })
      if (err) { setError(friendlyAuthError(err.message, err.status)); return }
      setSentTo(address); setCode(''); setCooldown(RESEND_SECONDS)
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
            <div>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#fff', border: `1px solid ${LINE}` }}><Mail size={26} aria-hidden /></span>
              <h1 className="mt-6 font-bold" style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.03em' }}>Escribe tu código</h1>
              <p className="mt-3 text-[16px] leading-relaxed" style={{ color: BODY }} role="status" aria-live="polite">Te hemos enviado un código de {CODE_LENGTH} dígitos a <strong style={{ color: INK }}>{sentTo}</strong>.</p>

              <form className="mt-6" onSubmit={e => { e.preventDefault(); if (code.length === CODE_LENGTH) verify(code) }}>
                <label htmlFor="otp" className="block text-[14px] font-semibold mb-2">Código</label>
                <input id="otp" name="otp" value={code} autoFocus required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={CODE_LENGTH}
                  onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH); setCode(v); if (v.length === CODE_LENGTH) verify(v) }}
                  aria-invalid={error ? true : undefined} aria-describedby={error ? 'auth-error' : undefined} placeholder="······"
                  className="w-full rounded-xl px-4 outline-none bg-white focus:border-[#111314]"
                  style={{ height: 64, border: `1.5px solid ${error ? '#B50F07' : LINE}`, color: INK, fontSize: 30, fontWeight: 700, letterSpacing: '0.4em', textAlign: 'center', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }} />
                {error && <p id="auth-error" role="alert" className="mt-2 text-[14px]" style={{ color: '#B50F07' }}>{error}</p>}
                <button type="submit" disabled={verifying || code.length !== CODE_LENGTH} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-white"
                  style={{ height: 54, background: ACCENT, border: 0, cursor: verifying ? 'wait' : 'pointer', opacity: verifying || code.length !== CODE_LENGTH ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {verifying ? 'Comprobando…' : <>Entrar <ArrowRight size={17} aria-hidden /></>}
                </button>
              </form>

              {inbox && (
                <a href={inbox.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold no-underline" style={{ height: 48, border: `1.5px solid ${LINE}`, color: INK, background: '#fff' }}>
                  Abrir {inbox.name}
                </a>
              )}
              <p className="mt-5 text-[14px] leading-relaxed" style={{ color: MUTED }}>
                También puedes pulsar el botón del correo, en este mismo navegador. Busca un mensaje de LinkHub (mira en spam o promociones). El código caduca pronto y solo funciona una vez.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
                <button type="button" onClick={() => send(sentTo)} disabled={cooldown > 0 || loading} className="underline" style={{ background: 'none', border: 0, padding: 0, minHeight: 44, color: cooldown > 0 ? MUTED : INK, cursor: cooldown > 0 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                  {cooldown > 0 ? `Reenviar en ${cooldown} s` : loading ? 'Enviando…' : 'Reenviar el código'}
                </button>
                <button type="button" onClick={() => { setSentTo(null); setError(null); setCode('') }} className="underline" style={{ background: 'none', border: 0, padding: 0, minHeight: 44, color: INK, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Usar otro correo</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-bold" style={{ fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.03em' }}>Entra a LinkHub</h1>
              <p className="mt-3 text-[16px] leading-relaxed" style={{ color: BODY }}>Sin contraseña: te enviamos un código de acceso (y un enlace, si prefieres). Si aún no tienes cuenta, se crea al entrar.</p>

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
                  {loading ? 'Enviando…' : <>Enviar código <ArrowRight size={17} aria-hidden /></>}
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
