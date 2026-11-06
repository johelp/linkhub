# Hallazgos

| ID | Prio | Estado | Título | Ubicación |
|---|---|---|---|---|
| SEC-001 | P0 | Corregido | Next.js 16.3.4 con CVE críticos (RCE en `next/og`, cache poisoning SSG/ISR, etc.) + sharp y source-map-js | `package.json` → next 16.4.5; `npm audit` = 0 |
| SEC-002 | P0 | Corregido | XSS almacenado: JSON-LD con `name`/SEO del dueño sin escapar `<` dentro de `<script>` | `src/app/p/[slug]/page.tsx` |
| SEC-003 | P1 | Corregido | URLs de bloques sin validar de esquema (`javascript:`, `data:`) renderizadas en `href` públicos | `src/lib/security.ts` (sanitizeBlocks) aplicado en `PATCH /api/pages` **y** al renderizar |
| SEC-004 | P1 | Corregido (migración pendiente) | `PATCH /api/pages` sin validación de forma/tamaño (blocks/settings/name), devolvía `error.message` de la BD | `src/app/api/pages/route.ts` |
| SEC-005 | P2 | Corregido en código / migración pendiente | Bucket `images` sin límite de tamaño ni MIME (SVG/HTML alojables en dominio del proyecto) | `011_security_hardening.sql` |
| SEC-006 | P2 | Corregido en código / migración pendiente | Inserción pública en `analytics_events` y `email_subscribers` sin restricciones (spam, inflado de métricas) | `011_security_hardening.sql` |
| SEC-007 | P2 | Corregido | Open redirect en `/auth/callback?next=` (`next=@evil.com`) | `src/app/auth/callback/route.ts` + `safeNextPath` |
| SEC-008 | P2 | Corregido | Sin cabeceras de seguridad globales (HSTS, Permissions-Policy, X-Frame-Options en áreas privadas); CORS `*` en `/api/*` | `next.config.ts`, `vercel.json` |
| SEC-009 | P2 | Corregido | Inyección de fórmulas en CSV de suscriptores; `/api/qr` sin validar slug; `/api/pay` sin validar precio/moneda | rutas respectivas |
| SEC-010 | P2 | Corregido | `.mcp.json` daba al agente acceso de escritura al proyecto Supabase de producción | `read_only=true` |
| SEC-011 | P2 | Corregido (migración pendiente) | Trigger de plan solo bloqueaba 6 bloques; la lista real de bloques Pro es mayor | `011_…sql` |
| SEC-012 | **P0 (acción tuya)** | Abierto | Claves de Supabase filtradas en el historial de Git | historial |
| SEC-013 | P2 | Corregido (activar clave) | Tokens OAuth de Mercado Pago en texto plano en `payment_connections` (solo service-role puede leerlos). **Corregido:** cifrado AES-256-GCM con `TOKEN_ENCRYPTION_KEY`, retrocompatible; script `scripts/encrypt-existing-tokens.mjs` | `src/lib/crypto.ts` |
| SEC-014 | P2 | Corregido (migración 013 pendiente) | Sin rate limiting en login (OTP), suscripción, `/api/pay`, subida de imágenes | — |
| SEC-015 | P2 | Parcial | CSP estricta con nonce en `/dashboard`, `/editor`, `/admin`, `/auth` (verificada, 0 violaciones). Páginas públicas: ver EX-002 | `next.config.ts` |
| SEC-016 | P2 | Parcial (migración 013 pendiente) | Admin definido por email en `ADMIN_EMAILS` sin MFA obligatorio; sin log de acciones admin | `src/lib/admin.ts` |
| SEC-017 | P3 | Corregido | Webhook de Stripe sin idempotencia por `event.id`; sin tests ni CI. **Corregido:** tabla `processed_webhook_events`, 16 tests (`npm test`), CI con typecheck, lint, tests, audit, build y gitleaks | `.github/workflows/ci.yml` |
| SEC-018 | P3 | Corregido (migración 013 pendiente) | `published` editable por el dueño anula la moderación del admin | `pages` RLS |
| SEC-019 | P3 | Abierto | Defecto no relacionado con seguridad pero grave: el reset CSS global anulaba todas las utilidades de padding/margen de Tailwind | `globals.css` — **corregido** |

**NO VERIFICADO:** configuración real de Supabase (Auth, SMTP, OTP, MFA de organización, PITR/backups), variables y roles en Vercel, historial completo de commits con secretos, TLS/cabeceras en producción.

Pruebas de regresión: `npm test` (Node test runner, 16 casos: saneo de URLs/redirecciones/ajustes, pedidos, citas y zonas horarias, cifrado, agregación de métricas). Verificación funcional manual con Supabase simulado + Playwright. Pendiente: tests de RLS contra una base real.
