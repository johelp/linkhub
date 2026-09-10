import crypto from 'crypto'

// Thin wrapper over Mercado Pago's REST API (not the SDK) -- OAuth Connect,
// Checkout Pro preferences, payment lookup, and webhook signature
// verification. See SETUP.md § Mercado Pago for the full setup walkthrough
// and links to the official docs this follows.

const MP_AUTH_URL = 'https://auth.mercadopago.com/authorization'
const MP_API = 'https://api.mercadopago.com'

export function getMercadoPagoAuthorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MERCADOPAGO_CLIENT_ID!,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: redirectUri,
    state,
  })
  return `${MP_AUTH_URL}?${params.toString()}`
}

interface MpTokenResponse {
  access_token: string
  refresh_token: string
  public_key: string
  user_id: number
  live_mode: boolean
}

export async function exchangeMercadoPagoCode(code: string, redirectUri: string): Promise<MpTokenResponse> {
  const res = await fetch(`${MP_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.MERCADOPAGO_CLIENT_ID,
      client_secret: process.env.MERCADOPAGO_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) throw new Error(`Mercado Pago token exchange failed: ${res.status} ${await res.text()}`)
  return res.json()
}

interface MpPreference {
  id: string
  init_point: string
  sandbox_init_point: string
}

export async function createMercadoPagoPreference(params: {
  accessToken: string
  title: string
  price: number
  currency: string
  externalReference: string
  notificationUrl: string
  backUrl: string
  // LinkHub's cut, auto-deducted from the seller's payout by Mercado Pago itself
  // (Split Payments 1:1 -- https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/overview).
  // A fixed amount in the same currency, not a percentage -- the caller does that math.
  marketplaceFee?: number
}): Promise<MpPreference> {
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      items: [{
        title: params.title,
        quantity: 1,
        unit_price: params.price,
        currency_id: params.currency,
      }],
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
      back_urls: { success: params.backUrl, failure: params.backUrl, pending: params.backUrl },
      auto_return: 'approved',
      ...(params.marketplaceFee ? { marketplace_fee: params.marketplaceFee } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Mercado Pago preference creation failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function getMercadoPagoPayment(accessToken: string, paymentId: string) {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Mercado Pago payment lookup failed: ${res.status} ${await res.text()}`)
  return res.json() as Promise<{
    status: string; transaction_amount: number; currency_id: string
    external_reference?: string; payer?: { email?: string }
  }>
}

// Verifies the `x-signature` header Mercado Pago sends on every webhook
// call: `ts=<unix ts>,v1=<hmac-sha256 hex>`, over the manifest string
// `id:{dataId};request-id:{requestId};ts:{ts};`, keyed with the secret
// configured in the MP dashboard (Your integrations → Webhooks).
export function verifyMercadoPagoSignature(params: {
  signatureHeader: string | null
  requestId: string | null
  dataId: string
  secret: string
}): boolean {
  if (!params.signatureHeader || !params.requestId) return false
  const parts = Object.fromEntries(
    params.signatureHeader.split(',').map(kv => kv.trim().split('=').map(s => s.trim()) as [string, string])
  )
  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const manifest = `id:${params.dataId};request-id:${params.requestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', params.secret).update(manifest).digest('hex')

  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(v1, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
