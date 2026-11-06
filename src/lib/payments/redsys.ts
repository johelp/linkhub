import crypto from 'node:crypto'

// Redsys (Spanish bank virtual POS) "redirection" integration, HMAC SHA-256.
// Each seller has their own commerce code (FUC), terminal and secret key from
// their bank, so credentials are per-merchant, not per-platform.
//
// Signature (per Redsys' official spec):
//   1. derived key = 3DES-CBC(zero IV, zero padding) of the ORDER number,
//      keyed with base64-decoded merchant secret;
//   2. Ds_Signature = base64( HMAC-SHA256(derived key, Ds_MerchantParameters) ),
//      where Ds_MerchantParameters is the base64 of the JSON parameters.

export const REDSYS_ENDPOINTS = {
  test: 'https://sis-t.redsys.es:25443/sis/realizarPago',
  live: 'https://sis.redsys.es/sis/realizarPago',
} as const

export const SIGNATURE_VERSION = 'HMAC_SHA256_V1'

// ISO 4217 numeric codes Redsys accepts for the common cases.
export const REDSYS_CURRENCIES: Record<string, string> = { EUR: '978', USD: '840', GBP: '826', MXN: '484', ARS: '032', BRL: '986', CLP: '152', COP: '170', PEN: '604', UYU: '858' }

export function derivedKey(secretBase64: string, order: string): Buffer {
  const key = Buffer.from(secretBase64, 'base64')
  if (key.length !== 24) throw new Error('Redsys secret key must decode to 24 bytes')
  const padded = Buffer.alloc(Math.ceil(order.length / 8) * 8)
  padded.write(order, 'utf8')
  const cipher = crypto.createCipheriv('des-ede3-cbc', key, Buffer.alloc(8, 0))
  cipher.setAutoPadding(false)
  return Buffer.concat([cipher.update(padded), cipher.final()])
}

export function sign(merchantParameters: string, order: string, secretBase64: string): string {
  return crypto.createHmac('sha256', derivedKey(secretBase64, order)).update(merchantParameters).digest('base64')
}

// Redsys may return the signature base64url-encoded; normalize before comparing.
const toStd = (b64: string) => b64.replace(/-/g, '+').replace(/_/g, '/')

export function encodeParameters(params: Record<string, string>): string {
  return Buffer.from(JSON.stringify(params), 'utf8').toString('base64')
}

export function decodeParameters(merchantParameters: string): Record<string, string> {
  return JSON.parse(Buffer.from(toStd(merchantParameters), 'base64').toString('utf8'))
}

// Case-insensitive read: Redsys returns Ds_Order / DS_ORDER depending on the channel.
export function param(params: Record<string, string>, name: string): string | undefined {
  const k = Object.keys(params).find(x => x.toLowerCase() === name.toLowerCase())
  return k ? params[k] : undefined
}

/** Order numbers: 4–12 chars, the first 4 must be digits. Unique per merchant. */
export function newOrderNumber(now = Date.now()): string {
  const head = String(now % 10000).padStart(4, '0')
  const tail = crypto.randomBytes(6).toString('hex').slice(0, 8).toUpperCase()
  return `${head}${tail}`
}

/** Redsys amounts are integer cents. */
export function toCents(amount: number): string {
  return String(Math.round(amount * 100))
}

export function verifyNotification(opts: { merchantParameters: string; signature: string; secretBase64: string }): { valid: boolean; params?: Record<string, string> } {
  try {
    const params = decodeParameters(opts.merchantParameters)
    const order = param(params, 'Ds_Order')
    if (!order) return { valid: false }
    const expected = Buffer.from(sign(opts.merchantParameters, order, opts.secretBase64))
    const got = Buffer.from(toStd(opts.signature))
    const valid = expected.length === got.length && crypto.timingSafeEqual(expected, got)
    return { valid, params: valid ? params : undefined }
  } catch {
    return { valid: false }
  }
}

/** Ds_Response 0000–0099 = authorised. */
export function isAuthorised(params: Record<string, string>): boolean {
  const code = param(params, 'Ds_Response')
  return !!code && /^\d{1,4}$/.test(code) && Number(code) <= 99
}

export interface RedsysCredentials { merchantCode: string; terminal: string; secretBase64: string; environment: 'test' | 'live' }

export function buildPaymentForm(opts: {
  creds: RedsysCredentials
  order: string
  amount: number
  currency: string
  description: string
  merchantName: string
  notificationUrl: string
  okUrl: string
  koUrl: string
  language?: string
}): { action: string; fields: Record<string, string> } {
  const numeric = REDSYS_CURRENCIES[opts.currency]
  if (!numeric) throw new Error(`Redsys: unsupported currency ${opts.currency}`)
  const params: Record<string, string> = {
    DS_MERCHANT_AMOUNT: toCents(opts.amount),
    DS_MERCHANT_ORDER: opts.order,
    DS_MERCHANT_MERCHANTCODE: opts.creds.merchantCode,
    DS_MERCHANT_CURRENCY: numeric,
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_TERMINAL: opts.creds.terminal,
    DS_MERCHANT_MERCHANTURL: opts.notificationUrl,
    DS_MERCHANT_URLOK: opts.okUrl,
    DS_MERCHANT_URLKO: opts.koUrl,
    DS_MERCHANT_PRODUCTDESCRIPTION: opts.description.slice(0, 125),
    DS_MERCHANT_MERCHANTNAME: opts.merchantName.slice(0, 25),
    DS_MERCHANT_CONSUMERLANGUAGE: opts.language ?? '001',
  }
  const mp = encodeParameters(params)
  return {
    action: REDSYS_ENDPOINTS[opts.creds.environment],
    fields: { Ds_SignatureVersion: SIGNATURE_VERSION, Ds_MerchantParameters: mp, Ds_Signature: sign(mp, opts.order, opts.creds.secretBase64) },
  }
}

export function validateCredentialsShape(c: { merchantCode: string; terminal: string; secret: string }): string | null {
  if (!/^\d{6,9}$/.test(c.merchantCode.trim())) return 'El código de comercio (FUC) son 6 a 9 números'
  if (!/^\d{1,3}$/.test(c.terminal.trim())) return 'El terminal es un número (normalmente 1)'
  try {
    if (Buffer.from(c.secret.trim(), 'base64').length !== 24) return 'La clave secreta no tiene el formato esperado (32 caracteres)'
  } catch { return 'La clave secreta no es válida' }
  return null
}
