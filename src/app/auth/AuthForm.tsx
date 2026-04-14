'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const R = '#E8150A'
const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const SNOW = '#F6F6F5'
const BORDER = 'rgba(26,27,28,0.09)'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setSent(true)
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
          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 10 }}>Revisá tu email</h2>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                Enviamos un link a <strong>{email}</strong>.<br />
                Hacé clic en él para acceder.
              </p>
              <button onClick={() => setSent(false)}
                style={{ marginTop: 20, fontSize: 12, color: LIGHT, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                Usar otro email
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 6 }}>Acceder a LinkHub</h2>
              <p style={{ fontSize: 13, color: LIGHT, marginBottom: 20 }}>Sin contraseña — te enviamos un link mágico.</p>
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
                  {loading ? 'Enviando...' : 'Enviar link mágico →'}
                </button>
              </form>
              <p style={{ fontSize: 11, textAlign: 'center', marginTop: 16, color: LIGHT }}>
                Al continuar aceptás los <Link href="/terms" style={{ color: LIGHT }}>términos de uso</Link>
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
