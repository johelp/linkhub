'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setSent(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: '#F6F6F5' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 24, fontWeight: 700, color: '#1A1B1C', textDecoration: 'none' }}>
            Link<span style={{ color: '#E8150A' }}>Hub</span>
          </Link>
          <p style={{ fontSize: 13, color: '#9A9D9F', marginTop: 6 }}>Tu página de enlaces profesional</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid rgba(26,27,28,0.09)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#1A1B1C' }}>Revisá tu email</h2>
              <p style={{ fontSize: 13, color: '#5A5D60', lineHeight: 1.6 }}>
                Te enviamos un link a <strong>{email}</strong>.<br />Hacé clic en él para acceder.
              </p>
              <button onClick={() => setSent(false)}
                style={{ marginTop: 20, fontSize: 12, color: '#9A9D9F', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Usar otro email
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: '#1A1B1C' }}>Acceder a LinkHub</h2>
              <p style={{ fontSize: 13, color: '#9A9D9F', marginBottom: 20 }}>Sin contraseña — te enviamos un link por email.</p>
              <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email" value={email} required
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ padding: '12px 16px', borderRadius: 12, border: '1.5px solid rgba(26,27,28,0.09)', background: '#F6F6F5', fontSize: 14, color: '#1A1B1C', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = '#E8150A')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(26,27,28,0.09)')}
                />
                <button type="submit" disabled={loading || !email}
                  style={{ padding: '12px 0', borderRadius: 12, background: '#E8150A', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: loading ? 'wait' : 'pointer', opacity: loading || !email ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {loading ? 'Enviando...' : 'Enviar link mágico →'}
                </button>
              </form>
              <p style={{ fontSize: 11, textAlign: 'center', marginTop: 16, color: '#9A9D9F' }}>
                Al continuar aceptás los <Link href="/terms" style={{ color: '#9A9D9F' }}>términos de uso</Link>
              </p>
            </>
          )}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, marginTop: 20, color: '#9A9D9F' }}>
          <Link href="/" style={{ color: '#9A9D9F', textDecoration: 'underline' }}>← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
