import { Resend } from 'resend'
import { appEnv } from '@/lib/env'
import { ticketEmail, paymentFailedEmail, paymentRecoveredEmail, type Rendered } from '@/lib/emailTemplates'

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

// Outside production, real recipients must never get email from a test run:
// only addresses in EMAIL_SANDBOX_ALLOW (comma-separated) receive anything.
function sandboxBlocks(to: string): boolean {
  if (appEnv() === 'production') return false
  const allow = (process.env.EMAIL_SANDBOX_ALLOW || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  if (allow.includes(to.toLowerCase())) return false
  console.info('[email sandbox] skipped send to', to)
  return true
}

async function deliver(to: string, mail: Rendered) {
  if (sandboxBlocks(to)) return
  const from = process.env.RESEND_FROM_EMAIL || 'LinkHub <onboarding@resend.dev>'
  await getResend().emails.send({ from, to, subject: mail.subject, html: mail.html, text: mail.text })
}

export async function sendTicketEmail(params: { to: string; eventName: string; tierName: string; ticketUrl: string }) {
  await deliver(params.to, ticketEmail(params))
}

export async function sendPaymentFailedEmail(params: { to: string; portalUrl: string; pauseDate: string }) {
  await deliver(params.to, paymentFailedEmail(params))
}

export async function sendPaymentRecoveredEmail(params: { to: string; dashboardUrl: string }) {
  await deliver(params.to, paymentRecoveredEmail(params))
}
