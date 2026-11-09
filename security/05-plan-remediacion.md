# Plan de remediación

| Orden | Acción | Esfuerzo | Responsable | Plazo |
|---|---|---|---|---|
| 1 | Rotar claves Supabase (anon + service_role), actualizar Vercel, redeploy (SEC-012) | 30 min | owner | 24 h |
| 2 | Desplegar esta rama; aplicar `011_security_hardening.sql` en staging y luego producción | 1 h | owner | 7 días |
| 3 | ~~Rate limiting~~ Hecho en base de datos (013). Pendiente opcional: WAF de Vercel para DDoS volumétrico | — | owner | — |
| 4 | Definir `TOKEN_ENCRYPTION_KEY` en Vercel y ejecutar `scripts/encrypt-existing-tokens.mjs --apply` | 15 min | owner | 7 días |
| 5 | ~~CSP con nonces~~ Hecho para áreas privadas. Páginas públicas: EX-002 | — | owner | — |
| 6 | MFA obligatorio en Supabase org/Vercel/GitHub + log de acciones admin | 0.5 día | owner | 30 días |
| 7 | CI y tests: hechos. Pendiente: activar protección de `main` (PR obligatorio + checks) en GitHub | 15 min | owner | 7 días |
| 8 | Runbooks de incidente/restauración y prueba de restore | 1 día | owner | 90 días |

Controles compensatorios (un solo mantenedor): revisión diferida de cada PR por un agente/persona distinta, alertas de Vercel y Supabase a un canal, calendario trimestral de revisión.
