// Config + payload builders for the standalone QR tool pages under
// /herramientas/[slug] (see ROADMAP.md § SEO programático). Each tool
// produces a *different* QR payload format (WiFi provisioning string,
// a profile URL, a vCard) -- that's the real, distinct utility each page
// has to offer on its own, not just a reskinned form, per John Mueller's
// warning that programmatic SEO without real per-page value reads as spam.

export type QrToolKind = 'wifi' | 'instagram' | 'vcard'

export interface QrToolConfig {
  slug: string
  kind: QrToolKind
  label: string          // short name, used in nav/cards
  title: string          // page H1
  metaTitle: string
  metaDescription: string
  intro: string          // 1-2 sentences explaining what makes this QR format different
  icon: string
}

export const QR_TOOLS: QrToolConfig[] = [
  {
    slug: 'qr-wifi',
    kind: 'wifi',
    label: 'QR para WiFi',
    title: 'Generador de código QR para WiFi',
    metaTitle: 'Generador de código QR para WiFi gratis — conectate sin escribir la contraseña',
    metaDescription: 'Creá un código QR que conecta automáticamente a tu red WiFi al escanearlo, sin escribir la contraseña. Gratis, sin registro, todo se genera en tu navegador.',
    intro: 'A diferencia de un QR común, este codifica el nombre de tu red y la contraseña en un formato que el celular reconoce para conectarse solo — nadie tiene que tipear nada.',
    icon: '📶',
  },
  {
    slug: 'qr-instagram',
    kind: 'instagram',
    label: 'QR para Instagram',
    title: 'Generador de código QR para Instagram',
    metaTitle: 'Generador de código QR para Instagram gratis — llevá gente a tu perfil',
    metaDescription: 'Generá un código QR que abre directo tu perfil de Instagram al escanearlo. Ideal para vidrieras, tarjetas o carteles. Gratis y sin registro.',
    intro: 'Apunta directo a tu perfil (instagram.com/tu_usuario) — pensado para imprimir en vidrieras, remeras o mesas, donde escribir la URL a mano no es una opción.',
    icon: '📷',
  },
  {
    slug: 'qr-tarjeta-de-visita',
    kind: 'vcard',
    label: 'QR para tarjeta de visita',
    title: 'Generador de código QR para tarjeta de visita (vCard)',
    metaTitle: 'Generador de código QR para tarjeta de visita (vCard) gratis',
    metaDescription: 'Creá un código QR con tus datos de contacto que la otra persona puede guardar directo en su celular con un toque. Formato vCard, gratis y sin registro.',
    intro: 'No es un link: codifica tus datos en formato vCard, así quien escanea puede guardarte como contacto nuevo con un solo toque, sin escribir nada a mano.',
    icon: '🪪',
  },
]

export function getQrTool(slug: string): QrToolConfig | undefined {
  return QR_TOOLS.find(t => t.slug === slug)
}

// WiFi provisioning QR format (supported by iOS 11+ Camera and Android):
// WIFI:T:<WPA|WEP|nopass>;S:<ssid>;P:<password>;H:<true|false>;;
// Special chars \ ; , " need escaping inside each field per the spec.
function escapeWifiField(value: string): string {
  return value.replace(/([\\;,"])/g, '\\$1')
}

export function buildWifiPayload(params: { ssid: string; password: string; encryption: 'WPA' | 'WEP' | 'nopass'; hidden: boolean }): string {
  const ssid = escapeWifiField(params.ssid.trim())
  const auth = params.encryption
  const pass = auth === 'nopass' ? '' : `P:${escapeWifiField(params.password)};`
  return `WIFI:T:${auth};S:${ssid};${pass}H:${params.hidden ? 'true' : 'false'};;`
}

export function buildInstagramPayload(username: string): string {
  const clean = username.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '')
  return clean ? `https://instagram.com/${clean}` : ''
}

// vCard 3.0 -- widely supported by both iOS and Android's native camera/contacts apps.
function escapeVCard(value: string): string {
  return value.replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n')
}

export function buildVCardPayload(params: { name: string; phone: string; email: string; company: string }): string {
  if (!params.name.trim()) return ''
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(params.name.trim())};;;`,
    `FN:${escapeVCard(params.name.trim())}`,
  ]
  if (params.company.trim()) lines.push(`ORG:${escapeVCard(params.company.trim())}`)
  if (params.phone.trim()) lines.push(`TEL;TYPE=CELL:${escapeVCard(params.phone.trim())}`)
  if (params.email.trim()) lines.push(`EMAIL:${escapeVCard(params.email.trim())}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}
