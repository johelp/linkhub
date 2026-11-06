# Emails de la plataforma

Dos canales, un mismo diseño (`src/lib/emailLayout.ts`):

1. **Supabase Auth** (enlace mágico, confirmación, invitación, recuperación, cambio de correo, código): plantillas en `supabase/email-templates/`, generadas con `npm run emails:build`. Se envían por el SMTP configurado en Supabase.
2. **Transaccionales de LinkHub** (entradas, pago fallido, pago regularizado): `src/lib/email.ts` vía la API de Resend.

## Entorno de pruebas con subdominio (linkhub.johelpastorino.com)

1. Resend → Domains → Add domain → `linkhub.johelpastorino.com` (región cercana a tus usuarios).
2. Resend muestra registros DNS (SPF/MX de envío y DKIM). En Cloudflare → DNS, créalos **tal cual los muestra Resend**, con el proxy en **«Solo DNS» (nube gris)**. Añade también un TXT `_dmarc` con `v=DMARC1; p=none; rua=mailto:hola@linkhub.johelpastorino.com` (endurecer a `quarantine` cuando todo funcione).
3. Espera a «Verified» en Resend.
4. Variables: `RESEND_FROM_EMAIL=LinkHub <no-reply@linkhub.johelpastorino.com>`, `SUPPORT_EMAIL=hola@linkhub.johelpastorino.com`.
5. Supabase → Auth → SMTP: host `smtp.resend.com`, puerto 465, usuario `resend`, contraseña = API key, remitente el mismo `no-reply@…`. Sin esto Supabase limita a ~2 correos/hora.
6. Plantillas: `SUPPORT_EMAIL=… npm run emails:build`, luego `SUPABASE_ACCESS_TOKEN=… SUPABASE_PROJECT_REF=… npm run emails:push` (dry-run) y con `-- --apply`. Alternativa: pegar cada `.html` y su `.subject.txt` en Supabase → Auth → Email Templates.
7. Para recibir respuestas en `hola@…` hace falta Cloudflare Email Routing (reenvío a tu Gmail); es independiente del envío.

Fuera de producción solo reciben correo las direcciones de `EMAIL_SANDBOX_ALLOW`. Al pasar a un dominio definitivo se repite el proceso con ese dominio.
