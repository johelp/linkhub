import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/crypto'
import { resolvePayable, validMoney } from '@/lib/payments/payable'
import { buildPaymentForm, newOrderNumber, REDSYS_CURRENCIES, REDSYS_ENDPOINTS } from '@/lib/payments/redsys'
import { absoluteUrl } from '@/lib/utils'

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const REDSYS_ORIGINS = ['https://sis.redsys.es', 'https://sis-t.redsys.es:25443']

function html(body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pago seguro</title></head>` +
    `<body style="font-family:-apple-system,system-ui,sans-serif;background:#F6F6F5;color:#1A1B1C;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;box-sizing:border-box">${body}</body></html>`,
    { status, headers: {
      'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
      // This page only auto-submits one form to the bank's gateway.
      'Content-Security-Policy': `default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'self' ${REDSYS_ORIGINS.join(' ')}`,
    } })
}

// Redsys redirect: we sign the order with the seller's key and POST the
// buyer to the bank's payment page. Ticket buyers are asked for an email
// first (Redsys doesn't return one) so the ticket can be delivered.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const pageId = sp.get('pageId'), blockId = sp.get('blockId'), tierId = sp.get('tierId')
  if (!pageId || !blockId) return html('<p>Falta información para iniciar el pago.</p>', 400)

  const { payable } = await resolvePayable(await createClient(), { pageId, blockId, tierId })
  if (!payable) return html('<p>Este producto no está disponible.</p>', 404)
  const slug = payable.page.slug
  const back = (r: string) => NextResponse.redirect(absoluteUrl(`/p/${slug}?payment_error=${r}`))
  if (!validMoney(payable.price, payable.currency) || !REDSYS_CURRENCIES[payable.currency]) return back('failed')

  const admin = createAdminClient()
  const { data: conn } = await admin.from('payment_connections').select('provider_user_id, access_token, config, live_mode').eq('user_id', payable.page.user_id).eq('provider', 'redsys').maybeSingle()
  if (!conn) return back('not_configured')

  const email = (sp.get('email') ?? '').trim()
  if (payable.tier && !EMAIL.test(email)) {
    const hidden = [...sp.entries()].filter(([k]) => k !== 'email').map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')
    return html(`<form method="GET" action="/api/pay/redsys" style="background:#fff;border-radius:16px;padding:24px;max-width:360px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,.08)">
      <h1 style="font-size:18px;margin:0 0 6px">${esc(payable.title)}</h1>
      <p style="font-size:13px;color:#5A5D60;margin:0 0 14px">¿A qué email te enviamos la entrada?</p>
      ${hidden}<input name="email" type="email" required autofocus placeholder="tu@email.com" style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid #ddd;border-radius:10px;font-size:15px;margin-bottom:12px">
      <button style="width:100%;padding:13px;border:0;border-radius:12px;background:#1A1B1C;color:#fff;font-size:15px;font-weight:700;cursor:pointer">Continuar al pago</button></form>`)
  }

  const order = newOrderNumber()
  const { data: row, error: insertError } = await admin.from('payments').insert({
    page_id: pageId, block_id: blockId, provider: 'redsys', status: 'pending', amount: payable.price, currency: payable.currency,
    tier_id: payable.tier?.id ?? null, tier_name: payable.tier?.name ?? null, provider_preference_id: order, payer_email: payable.tier ? email : null,
  }).select('id').single()
  if (insertError || !row) return back('failed')

  try {
    const cfg = (conn.config ?? {}) as { terminal?: string; environment?: 'test' | 'live' }
    const form = buildPaymentForm({
      creds: { merchantCode: conn.provider_user_id, terminal: cfg.terminal ?? '1', secretBase64: decryptSecret(conn.access_token), environment: cfg.environment ?? (conn.live_mode ? 'live' : 'test') },
      order, amount: payable.price, currency: payable.currency, description: payable.title, merchantName: payable.page.name,
      notificationUrl: absoluteUrl('/api/webhooks/redsys'), okUrl: absoluteUrl(`/p/${slug}?paid=1`), koUrl: absoluteUrl(`/p/${slug}?payment_error=failed`),
    })
    if (!Object.values(REDSYS_ENDPOINTS).includes(form.action as never)) throw new Error('unexpected endpoint')
    const inputs = Object.entries(form.fields).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')
    return html(`<form id="f" method="POST" action="${esc(form.action)}">${inputs}<p style="font-size:14px;text-align:center">Redirigiendo a tu banco para el pago seguro…</p><noscript><button style="padding:12px 20px;font-size:15px">Continuar al pago</button></noscript></form><script>document.getElementById('f').submit()</script>`)
  } catch (err) {
    console.error('Redsys form error', err)
    return back('failed')
  }
}
