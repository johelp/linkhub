# Plan de remediación

| Orden | Acción | Esfuerzo | Responsable | Plazo |
|---|---|---|---|---|
| 1 | Rotar claves Supabase (anon + service_role), actualizar Vercel, redeploy (SEC-012) | 30 min | owner | 24 h |
| 2 | Desplegar esta rama; aplicar `011_security_hardening.sql` en staging y luego producción | 1 h | owner | 7 días |
| 3 | Rate limiting (Vercel WAF/Upstash) en OTP, suscripción, `/api/pay`, uploads | 0.5 día | owner | 30 días |
| 4 | Cifrar `access_token`/`refresh_token` (Supabase Vault o cifrado de campo) | 0.5 día | owner | 30 días |
| 5 | CSP con nonces (`proxy.ts`), empezando en `report-only` | 1 día | owner | 30 días |
| 6 | MFA obligatorio en Supabase org/Vercel/GitHub + log de acciones admin | 0.5 día | owner | 30 días |
| 7 | CI (lint+tsc+audit+gitleaks) y tests de `security.ts`/`orders.ts`; protección de `main` | 1 día | owner | 90 días |
| 8 | Runbooks de incidente/restauración y prueba de restore | 1 día | owner | 90 días |

Controles compensatorios (un solo mantenedor): revisión diferida de cada PR por un agente/persona distinta, alertas de Vercel y Supabase a un canal, calendario trimestral de revisión.
