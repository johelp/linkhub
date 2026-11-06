'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const R = '#E8150A'
const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#6B6E71'
const SNOW = '#F6F6F5'
const BORDER = 'rgba(26,27,28,0.09)'

// Supabase messages are English and technical; translate the ones people actually hit.
function friendlyAuthError(message: string, status?: number): string {
  if (status === 429 || /rate limit/i.test(message)) return 'Se han enviado demasiados correos en poco tiempo. Espera unos minutos e inténtalo de nuevo.'
  if (/invalid.*email|email.*invalid/i.test(message)) return 'Revisa la dirección de correo: no parece válida.'
  if (/signups? (not allowed|disabled)/i.test(message)) return 'Ahora mismo no se admiten cuentas nuevas con ese correo.'
  return 'No hemos podido enviar el enlace. Inténtalo de nuevo en unos minutos.'
}

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const callbackFailed = searchParams.get('error') === 'callback'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      })
      if (error) { toast.error(friendlyAuthError(error.message, error.status)); return }
      setSent(true)
    } catch {
      // createClient throws when the Supabase URL/key are not configured for this deployment.
      toast.error('El acceso no está disponible ahora mismo. Inténtalo de nuevo en unos minutos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: SNOW, fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 24, fontWeight: 700, color: INK, textDecoration: 'none' }}>
            Link<span style={{ color: R }}>Hub</span>
          </Link>
          <p style={{ fontSize: 13, color: LIGHT, marginTop: 6 }}>Tu página de enlaces profesional</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: `1px solid ${BORDER}` }}>
          {callbackFailed && !sent && (
            <p role="alert" style={{ fontSize: 13, color: '#B50F07', background: '#FEF0EF', borderRadius: 10, padding: '10px 12px', marginBottom: 14, lineHeight: 1.5 }}>
              El enlace no ha funcionado: puede haber caducado o haberse abierto en otro navegador. Pide uno nuevo y ábrelo en el mismo navegador desde el que lo solicitas.
            </p>
          )}
          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 10 }}>Revisa tu correo</h2>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                Te hemos enviado un enlace a <strong>{email}</strong>.<br />
                Ábrelo en este mismo navegador para acceder.
              </p>
              <button onClick={() => setSent(false)}
                style={{ marginTop: 20, fontSize: 12, color: LIGHT, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                Usar otro email
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 6 }}>Acceder a LinkHub</h2>
              <p style={{ fontSize: 13, color: LIGHT, marginBottom: 20 }}>Sin contraseña: te enviamos un enlace de acceso.</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email" value={email} required
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${BORDER}`, background: SNOW, fontSize: 14, color: INK, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = R)}
                  onBlur={e => (e.target.style.borderColor = BORDER)}
                />
                <button type="submit" disabled={loading || !email}
                  style={{ padding: '12px 0', borderRadius: 12, background: R, color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'wait' : 'pointer', opacity: loading || !email ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {loading ? 'Enviando...' : 'Enviar enlace de acceso →'}
                </button>
              </form>
              <p style={{ fontSize: 11, textAlign: 'center', marginTop: 16, color: LIGHT }}>
                Al continuar aceptas los <Link href="/legal/terminos" style={{ color: LIGHT }}>términos</Link> y la <Link href="/legal/privacidad" style={{ color: LIGHT }}>política de privacidad</Link>
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, marginTop: 20, color: LIGHT }}>
          <Link href="/" style={{ color: LIGHT, textDecoration: 'underline' }}>← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
