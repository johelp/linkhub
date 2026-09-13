'use client'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { QrToolConfig } from '@/lib/qrTools'
import { buildWifiPayload, buildInstagramPayload, buildVCardPayload } from '@/lib/qrTools'

const R = '#E8150A'
const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const BORDER = 'rgba(26,27,28,0.09)'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: 10, border: `1.5px solid ${BORDER}`,
  fontSize: 14, outline: 'none', fontFamily: 'inherit', color: INK, background: '#fff',
}
const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: INK, marginBottom: 6, display: 'block' }
const fieldWrap: React.CSSProperties = { marginBottom: 14 }

export function QrToolClient({ config }: { config: QrToolConfig }) {
  // WiFi fields
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [encryption, setEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [hidden, setHidden] = useState(false)
  // Instagram
  const [username, setUsername] = useState('')
  // vCard
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')

  const [qrUrl, setQrUrl] = useState<string | null>(null)

  const payload =
    config.kind === 'wifi' ? (ssid.trim() ? buildWifiPayload({ ssid, password, encryption, hidden }) : '') :
    config.kind === 'instagram' ? buildInstagramPayload(username) :
    buildVCardPayload({ name, phone, email, company })

  useEffect(() => {
    // No synchronous setState here for the empty case: rendering below
    // gates on `payload` directly, so a stale qrUrl while payload is empty
    // is simply never shown -- no need to race-clear it.
    if (!payload) return
    let cancelled = false
    QRCode.toDataURL(payload, { margin: 2, width: 280, errorCorrectionLevel: 'M', color: { dark: INK, light: '#FFFFFF' } })
      .then(url => { if (!cancelled) setQrUrl(url) })
      .catch(() => { if (!cancelled) setQrUrl(null) })
    return () => { cancelled = true }
  }, [payload])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 24 }} className="md:!grid-cols-2">
      <div style={{ background: '#fff', borderRadius: 18, padding: 24, border: `1px solid ${BORDER}` }}>
        {config.kind === 'wifi' && (
          <>
            <div style={fieldWrap}>
              <label style={labelStyle}>Nombre de la red (SSID)</label>
              <input style={inputStyle} value={ssid} onChange={e => setSsid(e.target.value)} placeholder="Mi-WiFi-Casa" maxLength={32} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Tipo de seguridad</label>
              <select style={inputStyle} value={encryption} onChange={e => setEncryption(e.target.value as typeof encryption)}>
                <option value="WPA">WPA / WPA2 / WPA3 (lo más común)</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Red abierta (sin contraseña)</option>
              </select>
            </div>
            {encryption !== 'nopass' && (
              <div style={fieldWrap}>
                <label style={labelStyle}>Contraseña</label>
                <input style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" maxLength={63} />
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: MUTED, cursor: 'pointer' }}>
              <input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} />
              La red está oculta
            </label>
          </>
        )}

        {config.kind === 'instagram' && (
          <div style={fieldWrap}>
            <label style={labelStyle}>Usuario de Instagram</label>
            <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="tu_usuario" maxLength={30} />
            <p style={{ fontSize: 11.5, color: MUTED, marginTop: 6 }}>Sin el @ — lo sacamos solo si lo escribís.</p>
          </div>
        )}

        {config.kind === 'vcard' && (
          <>
            <div style={fieldWrap}>
              <label style={labelStyle}>Nombre completo</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" maxLength={80} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Teléfono</label>
              <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+54 9 11 1234-5678" maxLength={30} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="vos@negocio.com" maxLength={80} type="email" />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Empresa (opcional)</label>
              <input style={inputStyle} value={company} onChange={e => setCompany(e.target.value)} placeholder="Tu negocio" maxLength={80} />
            </div>
          </>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 18, padding: 24, border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {payload && qrUrl ? (
          <>
            {/* Generated client-side from user-typed data, not a remote/static asset -- next/image can't optimize a data: URL usefully here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt={`Código QR — ${config.title}`} width={220} height={220} style={{ borderRadius: 12, border: `1px solid ${BORDER}` }} />
            <a href={qrUrl} download={`${config.slug}.png`}
              style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: R, padding: '10px 20px', borderRadius: 20, textDecoration: 'none' }}>
              Descargar PNG
            </a>
          </>
        ) : (
          <div style={{ width: 220, height: 220, borderRadius: 12, border: `1.5px dashed ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 16 }}>
            <p style={{ fontSize: 12.5, color: MUTED }}>Completá los datos para ver tu QR acá</p>
          </div>
        )}
        <p style={{ fontSize: 11, color: MUTED, textAlign: 'center', maxWidth: 240 }}>
          Se genera en tu navegador. No guardamos nada de lo que escribís acá.
        </p>
      </div>
    </div>
  )
}
