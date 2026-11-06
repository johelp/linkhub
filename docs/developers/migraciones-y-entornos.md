# Migraciones y entornos

## Entornos

`NEXT_PUBLIC_APP_ENV` (`production` | `staging`) decide el entorno (`src/lib/env.ts`); si no existe, en Vercel manda `VERCEL_ENV` y cualquier otra cosa (preview, local) se comporta como no producción. Fuera de producción:

- `X-Robots-Tag: noindex, nofollow` en todas las rutas (`next.config.ts`), `robots.ts` con `disallow: /` y `sitemap.ts` vacío.
- No se envían emails reales: solo a direcciones listadas en `EMAIL_SANDBOX_ALLOW`.

Recomendación (ver `security/`): **staging con su propio proyecto de Supabase**, claves de prueba de Stripe/Mercado Pago/Redsys y la rama `staging`; producción desde `main`. Prueba siempre cada migración primero en staging.

## Aplicar migraciones

Las migraciones están en `supabase/migrations/`, numeradas e **idempotentes** (`if not exists`, `drop … if exists`). Se aplican en orden con `supabase db push` o pegándolas en el SQL Editor. Las 001–010 están descritas en [`SETUP.md`](../../SETUP.md#3-base-de-datos-supabase). Desde la 011:

| # | Archivo | Qué hace | Si falta |
|---|---|---|---|
| 011 | `011_security_hardening.sql` | Tope y MIME de imágenes, RLS de inserciones públicas, protege `custom_domain`, plan de bloques en la base | Menos defensa en profundidad |
| 012 | `012_dashboard_stats.sql` | Funciones `owner_daily_stats`, `owner_top_blocks`, `owner_device_stats` | El panel usa una muestra limitada (≈1000 filas) |
| 013 | `013_hardening_phase2.sql` | `processed_webhook_events`, `admin_audit_log`, `pages.moderated_at` + trigger de moderación, límites anti-spam | Sin idempotencia de Stripe ni moderación |
| 014 | `014_multi_provider_payments.sql` | Permite `stripe` y `redsys` en `payment_connections`; columna `config` | No se pueden conectar esas pasarelas |
| 015 | `015_payment_events.sql` | `payment_events` (traza de pagos) | Sin historial detallado |
| 016 | `016_feature_flags.sql` | `feature_flags` y `feature_flag_overrides` | Rigen los valores por defecto del código (todo lo nuevo apagado) |
| 017 | `017_billing_lapse.sql` | `profiles.billing_lapsed_at` | Nadie se pausa por impago |
| 018 | `018_api_keys.sql` | `api_keys`, `api_key_audit`, triggers de protección y tope de 10 claves activas | Sin claves de API: la pantalla Desarrolladores no funciona |
| 019 | `019_knowledge_base.sql` | `knowledge_entries` (tope 300 por cuenta, RLS del dueño) | Sin base de conocimiento |
| 021 | `021_custom_domains.sql` | `custom_domains` + estado (pending/verified/active), token y restricciones; **sustituye la política de la 001** (el dueño ya no puede escribir `verified`) | Sin dominio propio |
| 020 | `020_roadmap_votes.sql` | `roadmap_votes` (máx. 10 votos por cuenta, RLS del dueño; totales solo con service role) | Sin votos en Próximamente |

Notas:

- **018 y 019 son independientes** entre sí (ambas solo dependen de `profiles`/`pages`); aplícalas en orden numérico igualmente.
- La 018 revoca privilegios de columna: el navegador nunca puede leer `key_hash` y solo puede modificar `revoked_at`. No la edites para «arreglar» permisos sin leer el comentario de cabecera.
- Cada migración, al añadirse, debe ir en esta tabla y en `docs/CHANGELOG.md`; si el panel de administración debe detectarla, añade una sonda en `src/app/admin/system/page.tsx` (hoy cubre 011–016).
- Tras aplicar la 016 puedes fijar flags desde `/admin/features`. El flag `developer_api` (API keys, MCP autenticado y `/api/v1`) nace **apagado**: actívalo por cliente (override) para el piloto.

## Variables de entorno

Plantilla: `.env.local.example`. En Vercel/Railway se cargan en el panel del proyecto. Las `NEXT_PUBLIC_*` se **incrustan en la compilación**: cambiarlas exige volver a compilar.

| Variable | Obligatoria | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Cliente de Supabase (navegador y servidor con sesión) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Service role: webhooks, admin, flags, lectura pública del MCP/API. **Secreta**, solo servidor |
| `NEXT_PUBLIC_APP_URL` | Sí | URL pública (enlaces absolutos, `llms.txt`, MCP, sitemap) |
| `NEXT_PUBLIC_APP_ENV` | Recomendada (obligatoria en producción fuera de Vercel) | `production` / `staging`. `next.config.ts` añade `noindex` si no vale `production` y `VERCEL_ENV` tampoco |
| `ADMIN_EMAILS` | Para usar `/admin` | Correos con acceso (coma). Vacía = nadie. También reciben todos los flags |
| `TOKEN_ENCRYPTION_KEY` | Recomendada en producción | 32 bytes base64 (`openssl rand -base64 32`); cifra tokens/secretos de pasarelas. Ver runbook en `security/06-runbooks.md` |
| `BILLING_GRACE_DAYS` | No | Días de gracia antes de pausar por impago (0–90, 7 por defecto) |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO` | Para cobrar el plan Pro | Suscripciones |
| `STRIPE_CONNECT_CLIENT_ID`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `STRIPE_PLATFORM_FEE_PERCENT` | Opcionales | Stripe Connect para los clientes (comisión 0–100) |
| `MERCADOPAGO_CLIENT_ID`, `MERCADOPAGO_CLIENT_SECRET`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_PLATFORM_FEE_PERCENT` | Opcionales | Mercado Pago (OAuth, webhooks, comisión) |
| `ANTHROPIC_API_KEY`, `AI_MODEL` | Opcionales | Asistente «Crear con IA» (flag `ai_onboarding`) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPPORT_EMAIL` | Recomendadas | Emails transaccionales (ver `docs/operacion/emails.md`) |
| `EMAIL_SANDBOX_ALLOW` | No | En no producción, únicos destinatarios que reciben email |
| `NEXT_PUBLIC_ENDORSELY_ORG_ID` | No | Programa de afiliados |
| `VERCEL_ENV`, `VERCEL_GIT_COMMIT_SHA` | Las pone Vercel | Entorno y commit mostrados por `/api/health` |

El MCP, la API de claves y `/api/v1` **no añaden variables nuevas**: usan las de Supabase y `NEXT_PUBLIC_APP_URL`. Redsys no necesita variables de plataforma (credenciales por vendedor).


## Script único 011–021
`supabase/bundles/011-021.sql` reúne las migraciones 011 a 021 en una sola transacción, con comprobación previa de 001–010 y consulta de verificación final. Se regenera con `npm run sql:bundle` (no editar a mano). Para pegarlo en el SQL Editor de **staging**.
