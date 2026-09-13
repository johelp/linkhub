import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(key)
  }
  return _resend
}

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

export async function sendTicketEmail(params: {
  to: string
  eventName: string
  tierName: string
  ticketUrl: string
}) {
  const from = process.env.RESEND_FROM_EMAIL || 'LinkHub <onboarding@resend.dev>'
  await getResend().emails.send({
    from,
    to: params.to,
    subject: `Tu entrada — ${params.eventName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1A1B1C;">¡Listo! Tu entrada está confirmada</h2>
        <p style="color:#5A5D60;">${params.eventName} — ${params.tierName}</p>
        <p style="color:#5A5D60;">Presentá el código QR en la entrada del evento.</p>
        <p style="margin-top:24px;">
          <a href="${params.ticketUrl}" style="background:#E8150A;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">
            Ver mi entrada
          </a>
        </p>
        <p style="color:#9A9D9F;font-size:12px;margin-top:24px;">Enviado por LinkHub</p>
      </div>
    `,
  })
}
