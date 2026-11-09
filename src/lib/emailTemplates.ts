import { codeBox, emailLayout, emailText, escapeHtml, para } from './emailLayout.ts'

export interface Rendered { subject: string; html: string; text: string }

// ─── Supabase Auth templates ─────────────────────────────────────
// Supabase substitutes the {{ .Placeholders }} itself, so these strings are
// used verbatim (never run through escapeHtml).
export interface AuthTemplate { key: string; subject: string; html: string; text: string }

const auth = (key: string, subject: string, p: Parameters<typeof emailLayout>[0], lines: string[]): AuthTemplate => ({
  key, subject, html: emailLayout(p), text: emailText({ title: p.title, lines, cta: p.cta, note: p.note }),
})

export const AUTH_TEMPLATES: AuthTemplate[] = [
  // Magic link AND one-time code in the same email: the code is typed in the tab
  // that asked for it (no stuck tab if the link opens in another browser).
  auth('magic_link', 'Tu código de acceso a LinkHub: {{ .Token }}', {
    preheader: 'Tu código: {{ .Token }}. Escríbelo donde lo pediste.', title: 'Tu código de acceso',
    body: para('Escribe este código en la pantalla de LinkHub donde pediste entrar con <strong>{{ .Email }}</strong>:') + codeBox('{{ .Token }}') +
      para('¿Prefieres un clic? También puedes usar este botón, en el mismo navegador donde lo pediste:'),
    cta: { label: 'Acceder a LinkHub', url: '{{ .ConfirmationURL }}' },
    note: 'El código y el enlace caducan pronto y solo funcionan una vez. Si no lo has pedido tú, ignora este correo: nadie entrará sin él. Nunca compartas este código.',
  }, ['Tu código de acceso: {{ .Token }}', 'Escríbelo en la pantalla de LinkHub donde pediste entrar con {{ .Email }}.', 'O abre este enlace en el mismo navegador (caduca pronto y solo funciona una vez).']),

  auth('confirmation', 'Tu código para activar LinkHub: {{ .Token }}', {
    preheader: 'Tu código: {{ .Token }}. Un último paso para activar tu cuenta.', title: 'Confirma tu correo',
    body: para('Gracias por crear tu cuenta en LinkHub. Escribe este código en la pantalla donde empezaste para confirmar que <strong>{{ .Email }}</strong> es tuyo:') + codeBox('{{ .Token }}') +
      para('O pulsa el botón, en el mismo navegador:'),
    cta: { label: 'Confirmar mi correo', url: '{{ .ConfirmationURL }}' },
    note: 'Si no has creado una cuenta, ignora este mensaje. Nunca compartas este código.',
  }, ['Tu código de confirmación: {{ .Token }}', 'Escríbelo en la pantalla de LinkHub donde empezaste, para confirmar {{ .Email }}.']),

  auth('invite', 'Te han invitado a LinkHub', {
    preheader: 'Tienes una invitación para unirte.', title: 'Te han invitado a LinkHub',
    body: para('Alguien te ha invitado a crear tu página profesional en LinkHub. Acepta la invitación para empezar.'),
    cta: { label: 'Aceptar invitación', url: '{{ .ConfirmationURL }}' },
  }, ['Te han invitado a LinkHub. Acepta la invitación para empezar.']),

  auth('recovery', 'Recupera el acceso a tu cuenta', {
    preheader: 'Restablece el acceso a tu cuenta de LinkHub.', title: 'Recupera el acceso',
    body: para('Hemos recibido una solicitud para recuperar el acceso a tu cuenta. Pulsa el botón para continuar.'),
    cta: { label: 'Recuperar acceso', url: '{{ .ConfirmationURL }}' },
    note: 'Si no has sido tú, ignora este correo: tu cuenta sigue segura.',
  }, ['Abre este enlace para recuperar el acceso a tu cuenta.']),

  auth('email_change', 'Confirma tu nuevo correo en LinkHub', {
    preheader: 'Confirma el cambio de correo de tu cuenta.', title: 'Confirma tu nuevo correo',
    body: para('Has pedido cambiar el correo de tu cuenta a <strong>{{ .NewEmail }}</strong>. Confírmalo para completar el cambio.'),
    cta: { label: 'Confirmar el cambio', url: '{{ .ConfirmationURL }}' },
    note: 'Si no has pedido este cambio, no hagas nada y contáctanos.',
  }, ['Confirma el cambio de correo a {{ .NewEmail }}.']),

  auth('reauthentication', 'Tu código de verificación de LinkHub', {
    preheader: 'Usa este código para confirmar que eres tú.', title: 'Código de verificación',
    body: para('Introduce este código para confirmar la acción que estás realizando:') +
      `<p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:0.18em;color:#111314;">{{ .Token }}</p>`,
    note: 'Caduca en unos minutos. Si no lo has pedido, ignora este correo.',
  }, ['Tu código de verificación: {{ .Token }}']),
]

// ─── Transactional emails sent by LinkHub (Resend) ───────────────
export function ticketEmail(p: { eventName: string; tierName: string; ticketUrl: string }): Rendered {
  const title = 'Tu entrada está confirmada'
  const ev = escapeHtml(p.eventName), tier = escapeHtml(p.tierName)
  const cta = { label: 'Ver mi entrada', url: p.ticketUrl }
  return {
    subject: `Tu entrada para ${p.eventName}`,
    html: emailLayout({ preheader: `${ev} · ${tier}. Presenta el código QR en la puerta.`, title,
      body: para(`<strong>${ev}</strong> — ${tier}`) + para('Presenta el código QR de tu entrada en la puerta del evento. Puedes abrirla desde el móvil o imprimirla.'),
      cta, note: 'Guarda este correo: es tu comprobante.' }),
    text: emailText({ title, lines: [`${p.eventName} — ${p.tierName}`, 'Presenta el código QR en la puerta del evento.'], cta, note: 'Guarda este correo: es tu comprobante.' }),
  }
}

export function paymentFailedEmail(p: { portalUrl: string; pauseDate: string }): Rendered {
  const title = 'No hemos podido cobrar tu suscripción'
  const date = escapeHtml(p.pauseDate)
  const cta = { label: 'Actualizar método de pago', url: p.portalUrl }
  return {
    subject: 'No hemos podido cobrar tu suscripción de LinkHub',
    html: emailLayout({ preheader: `Actualiza tu método de pago antes del ${date} para que tus páginas sigan visibles.`, title,
      body: para('El último cobro de tu plan Pro no se ha podido completar, normalmente por una tarjeta caducada o sin fondos.') +
        para(`Actualiza tu método de pago antes del <strong>${date}</strong> y tus páginas seguirán funcionando con normalidad. Pasada esa fecha se pausarán temporalmente hasta que se regularice.`),
      cta, note: 'Si ya lo has resuelto, no necesitas hacer nada más.' }),
    text: emailText({ title, lines: ['El último cobro de tu plan Pro no se ha podido completar.', `Actualiza tu método de pago antes del ${p.pauseDate} para que tus páginas sigan visibles.`], cta }),
  }
}

export function paymentRecoveredEmail(p: { dashboardUrl: string }): Rendered {
  const title = 'Todo en orden: tus páginas están activas'
  const cta = { label: 'Ir a mi panel', url: p.dashboardUrl }
  return {
    subject: 'Tu suscripción de LinkHub está al día',
    html: emailLayout({ preheader: 'Hemos recibido tu pago. Tus páginas funcionan con normalidad.', title,
      body: para('Hemos recibido tu pago y tu suscripción está al día. Tus páginas están visibles y listas para recibir clientes.'), cta }),
    text: emailText({ title, lines: ['Hemos recibido tu pago y tu suscripción está al día.'], cta }),
  }
}
