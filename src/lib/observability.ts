import { appEnv } from '@/lib/env'
import { createDeduper, formatAlert } from '@/lib/alerting'

const shouldSend = createDeduper(10 * 60 * 1000)

// Central place to report a server-side failure. Always logs (structured, secrets
// scrubbed); if ALERT_WEBHOOK_URL is set (Slack/Discord/Teams-compatible
// incoming webhook) it also pings the owner. Never throws and never blocks
// the request for more than a couple of seconds.
export async function reportError(scope: string, err: unknown): Promise<void> {
  const alert = formatAlert(scope, err, appEnv())
  console.error(JSON.stringify({ level: 'error', ...alert }))
  const url = process.env.ALERT_WEBHOOK_URL
  if (!url || !shouldSend(alert)) return
  const text = `LinkHub [${alert.env}] ${alert.scope}: ${alert.message}`
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text }),
      signal: AbortSignal.timeout(2000),
    })
  } catch { /* alerting must never break the request */ }
}
