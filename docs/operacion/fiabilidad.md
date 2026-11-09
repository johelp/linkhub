# Fiabilidad y alertas

| Pieza | Dónde | Qué hace |
|---|---|---|
| Páginas de error | `src/app/error.tsx`, `global-error.tsx` | Mensaje amable, reintentar y código de referencia (digest) para localizar el log. |
| `reportError(scope, err)` | `src/lib/observability.ts` | Log JSON con secretos y correos tachados; si existe `ALERT_WEBHOOK_URL` avisa por webhook (Slack/Discord/Teams), máximo una vez cada 10 min por mismo error. Nunca lanza. |
| Health | `GET /api/health` | 200 `ok` / 503 `degraded` según la base de datos. |
| Uptime | `.github/workflows/uptime.yml` | Cada 15 min consulta la URL de la variable de repo `HEALTHCHECK_URL`; si falla, GitHub avisa por correo. |

Cubierto por `reportError`: webhooks de Stripe, Stripe Connect, Mercado Pago y Redsys, y el correo de impago.
No cubierto aún: rutas `/api/pay/*`, `/api/connect/*` y acciones de panel (siguen con `console.error`).

## Configuración
1. Crea un webhook entrante (p. ej. Slack → Incoming Webhooks) y ponlo en `ALERT_WEBHOOK_URL` (Vercel, solo producción y staging).
2. En GitHub → Settings → Secrets and variables → Actions → Variables: `HEALTHCHECK_URL=https://<dominio>/api/health`.
3. Si usas un monitor externo (UptimeRobot, Better Stack), apunta también a `/api/health`.
