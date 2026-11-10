// One visual system for every email LinkHub sends (Supabase Auth templates and
// our own transactional mail). Table layout + inline styles on purpose: it is
// the only thing Gmail/Outlook/Apple Mail render consistently. No images (no
// blocked-image placeholders, nothing to track), no emoji, no web fonts.
export const INK = '#111314'
export const BODY = '#3F4346'
export const MUTED = '#6B6F73'
export const LINE = '#E6E6E2'
export const ACCENT = '#E8150A'
// Support address shown in the footer. Set SUPPORT_EMAIL before `npm run emails:build`
// so the Supabase Auth templates carry the real one.
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'hola@linkhub.johelpastorino.com'
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

export interface EmailParts {
  preheader: string            // the grey line next to the subject in the inbox
  title: string
  /** Trusted HTML for the body (callers must escape any dynamic text with escapeHtml). */
  body: string
  cta?: { label: string; url: string }
  /** Small print under the button, e.g. "El enlace caduca en 1 hora". */
  note?: string
}

export const para = (html: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${BODY};">${html}</p>`

/** Large one-time code, easy to read and copy (the value is a Supabase placeholder or a real code). */
export const codeBox = (value: string) =>
  `<p style="margin:0 0 20px;padding:18px 20px;background:#F4F4F1;border:1px solid ${LINE};border-radius:12px;text-align:center;font-size:34px;line-height:1;font-weight:700;letter-spacing:0.28em;color:${INK};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${value}</p>`

export function emailLayout(p: EmailParts): string {
  const button = p.cta
    ? `<tr><td style="padding:8px 0 24px;"><a href="${p.cta.url}" style="display:inline-block;background:${ACCENT};color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:999px;">${p.cta.label}</a></td></tr>
       <tr><td style="padding:0 0 20px;font-size:13px;line-height:1.5;color:${MUTED};">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${p.cta.url}" style="color:${MUTED};word-break:break-all;">${p.cta.url}</a></td></tr>`
    : ''
  const note = p.note ? `<tr><td style="padding:0 0 8px;font-size:13px;line-height:1.5;color:${MUTED};">${p.note}</td></tr>` : ''
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${p.title}</title></head>
<body style="margin:0;padding:0;background:#F4F4F1;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${p.preheader}&#8199;&zwnj;&#8199;&zwnj;&#8199;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F1;padding:32px 12px;font-family:${FONT};">
<tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
    <tr><td style="padding:0 4px 20px;font-size:22px;font-weight:700;color:${INK};letter-spacing:-0.02em;">Link<span style="color:${ACCENT};">Hub</span></td></tr>
    <tr><td style="background:#FFFFFF;border:1px solid ${LINE};border-radius:16px;padding:36px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 16px;font-size:24px;line-height:1.25;font-weight:700;color:${INK};letter-spacing:-0.02em;">${p.title}</td></tr>
        <tr><td>${p.body}</td></tr>
        ${button}
        ${note}
      </table>
    </td></tr>
    <tr><td style="padding:20px 8px 0;font-size:12px;line-height:1.6;color:${MUTED};text-align:center;">
      LinkHub · Tu presencia profesional sin necesidad de una web<br>
      Este es un mensaje automático de tu cuenta. Si necesitas ayuda, responde a este correo o escribe a <a href="mailto:${SUPPORT_EMAIL}" style="color:${MUTED};">${SUPPORT_EMAIL}</a>.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}

/** Plain-text twin (better deliverability, and for clients that block HTML). */
export function emailText(p: { title: string; lines: string[]; cta?: { label: string; url: string }; note?: string }): string {
  return [p.title, '', ...p.lines, ...(p.cta ? ['', `${p.cta.label}: ${p.cta.url}`] : []), ...(p.note ? ['', p.note] : []), '', '—', `LinkHub · ${SUPPORT_EMAIL}`].join('\n')
}
