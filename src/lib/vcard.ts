// vCard 3.0 (RFC 2426) generator: the format every phone's contacts app imports.
// Values are escaped and long lines folded, so owner text can never break out
// of a field or inject extra properties (CRLF injection).
export interface VCardInput {
  name: string
  organization?: string
  title?: string
  phone?: string
  whatsapp?: string
  email?: string
  url?: string
  address?: string
  note?: string
  photoUrl?: string
}

const esc = (v: string) => v.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\;').replace(/,/g, '\\,')
const clean = (v: string | undefined, max = 200) => (v ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, max)

// Lines are folded at 75 octets (continuation lines start with a space).
export function fold(line: string): string {
  const out: string[] = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const b = Buffer.byteLength(ch)
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ch; bytes = b } else { cur += ch; bytes += b }
  }
  out.push(cur)
  return out.join('\r\n ')
}

export function buildVCard(v: VCardInput): string {
  const name = clean(v.name, 100) || 'Contacto'
  const parts = name.split(/\s+/)
  const family = parts.length > 1 ? parts[parts.length - 1] : ''
  const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : name
  const phone = clean(v.phone, 30).replace(/[^\d+()\-\s]/g, '')
  const wa = clean(v.whatsapp, 30).replace(/\D/g, '')
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N:${esc(family)};${esc(given)};;;`, `FN:${esc(name)}`,
    v.organization ? `ORG:${esc(clean(v.organization, 100))}` : '',
    v.title ? `TITLE:${esc(clean(v.title, 100))}` : '',
    phone ? `TEL;TYPE=WORK,VOICE:${phone}` : '',
    wa && `+${wa}` !== phone ? `TEL;TYPE=CELL:+${wa}` : '',
    v.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()) ? `EMAIL;TYPE=WORK:${esc(v.email.trim().slice(0, 120))}` : '',
    v.url && /^https?:\/\//.test(v.url) ? `URL:${v.url.slice(0, 300)}` : '',
    v.address ? `ADR;TYPE=WORK:;;${esc(clean(v.address, 200))};;;;` : '',
    v.note ? `NOTE:${esc(clean(v.note, 300))}` : '',
    v.photoUrl && /^https?:\/\//.test(v.photoUrl) ? `PHOTO;VALUE=URI:${v.photoUrl.slice(0, 300)}` : '',
    'END:VCARD',
  ].filter(Boolean)
  return lines.map(fold).join('\r\n') + '\r\n'
}
