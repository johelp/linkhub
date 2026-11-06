# Seguridad

Resumen de controles que existen **en el código**. El detalle, la evidencia y el plan de remediación están en [`security/`](../../security/) (empieza por `00-resumen-ejecutivo.md`, `03-hallazgos.md`, `06-runbooks.md`). Esto no es una certificación SOC 2 / ISO 27001. Los puntos que dependen de acciones en Supabase/Vercel (aplicar migraciones, rotar claves, proteger `main`, MFA del admin) siguen en `security/`.

## Controles por capa

| Capa | Control | Dónde |
|---|---|---|
| Acceso a datos | RLS por dueño en todas las tablas de cliente; tablas sensibles solo con service role (sin políticas) | `supabase/migrations/` |
| Plan y facturación | `profiles.plan` y columnas de Stripe no editables por el usuario; límites de plan en base (`enforce_plan_limits`), en servidor (`pageWrite.ts`) y en UI | 005, 011, `src/lib/pageWrite.ts` |
| Escritura de páginas | Un único pipeline: forma, tamaño (≤512 KB, ≤100 bloques), colores, plan, flags, saneado de URLs | `src/lib/pageWrite.ts` (editor y MCP) |
| XSS | `sanitizeBlocks`/`sanitizeSettings` al guardar y al renderizar; JSON-LD con `<` escapado; IDs de píxeles validados por formato | `security.ts`, `p/[slug]/page.tsx` |
| Sesión y rutas | `proxy.ts` redirige sin sesión; cada API valida su propia autenticación; `/auth/callback` solo acepta rutas internas | `src/proxy.ts`, `safeNextPath` |
| Cabeceras | HSTS, nosniff, Referrer-Policy, Permissions-Policy, CSP base; `X-Frame-Options: DENY` y `no-store` en áreas privadas y `/api/*`; CSP con nonce en `/dashboard`, `/editor`, `/admin`, `/auth` (producción) | `next.config.ts`, `src/proxy.ts` |
| Secretos de pasarela | AES-256-GCM con `TOKEN_ENCRYPTION_KEY`; nunca en respuestas de API/MCP | `src/lib/crypto.ts` |
| Pagos | Precio solo desde la página guardada; firmas y importes verificados; idempotencia de webhooks; traza en `payment_events` | `src/lib/payments/`, `api/webhooks/` |
| Administración | `ADMIN_EMAILS` cerrado por defecto; comprobación en servidor en cada ruta; bitácora `admin_audit_log`; moderación que el dueño no puede revertir | `admin.ts`, `admin.server.ts`, 013 |
| Abuso | Límites anti-spam en base para inserciones públicas; límites en memoria para MCP/API | 013, `src/lib/mcp/rateLimit.ts` |
| Cadena de suministro | CI: typecheck, eslint, tests, `npm audit --omit=dev` (high), build y gitleaks; Dependabot | `.github/` |

## API keys y MCP

Amenazas consideradas y mitigación:

| Amenaza | Mitigación |
|---|---|
| **Filtración de una clave** | Se muestra una vez; en base solo SHA-256 + prefijo; la clave tiene 256 bits aleatorios (`lh_` + 32 bytes); caducidad opcional (máx. 1 año), revocación inmediata, máx. 10 activas por cuenta; el navegador no puede leer el hash (privilegios de columna, 018); la UI avisa de no usarla en webs; el CORS del MCP no admite la cabecera `Authorization`. `gitleaks` en CI |
| **Fuerza bruta** | Entropía de 256 bits; formato validado antes de tocar la base; comparación en tiempo constante del hash; tras 10 fallos por IP, ~3 intentos/min y 429 incluso con clave buena |
| **Escalada de permisos** | Scopes mínimos por herramienta, comprobados en el despacho (`-32003`); scopes desconocidos en la fila se descartan; la sesión solo puede poner `revoked_at` y no puede reactivar (trigger); las herramientas públicas no ven las privadas; `published`, `slug`, `custom_domain`, plan y moderación **no** son modificables por MCP |
| **Acceso a datos de otro cliente** | La API usa service role (sin RLS), así que cada consulta filtra por `user_id` de la clave; el identificador nunca viene de los argumentos (`user_id` se rechaza); ids ajenos responden «no encontrada». Verificado en `tests/mcp-store.test.ts` y `tests/mcp-private.test.ts` |
| **Inyección de instrucciones vía contenido de páginas** | Todo texto de terceros se devuelve dentro de `<datos_no_confiables>` con aviso, `<` escapado y `structuredContent.untrusted`; las herramientas públicas no escriben nada y los enlaces de reserva/pedido requieren que la persona los abra; la escritura exige clave. Riesgo residual: un modelo puede obedecer igualmente, por eso el cliente debe pedir confirmación en herramientas de escritura |
| **SSRF** | No existen peticiones salientes en el MCP ni en la API (solo Supabase) |
| **Abuso / denegación** | Cubos por IP (30) y por clave (120), cuerpo ≤32 KB / 640 KB, lote ≤20, argumentos con esquema estricto y longitudes máximas; *límite por instancia* en serverless (ver [mcp.md](./mcp.md#límites)) |
| **Repudio** | `api_key_audit`: cada escritura se registra **antes** de ejecutarse (clave, acción, objetivo, campos tocados, hash truncado de IP; sin contenido ni IP en claro); si no puede registrarse, se rechaza. El dueño ve las últimas 10 en el panel |
| **Datos de pago** | `list_payments` es solo lectura, con columnas explícitas, email enmascarado; sin tokens, credenciales de pasarela ni datos de tarjeta (que LinkHub nunca almacena) |
| **CORS** | Nivel público: `*` sin credenciales y solo `Content-Type`, `Accept`, `MCP-Protocol-Version`. Autenticado y `/api/v1`: sin cabeceras CORS |
| **Páginas privadas o retiradas** | El MCP público trata igual (404 genérico) páginas inexistentes, sin publicar, `noindex` o pausadas por impago |
| **Despliegue** | Todo el acceso autenticado exige el flag `developer_api`, apagado por defecto (los administradores siempre pasan) |

Huecos conocidos: los límites de uso no son globales en serverless; la IP depende del proxy de la plataforma; no hay rotación automática de claves ni alertas por uso anómalo; `last_used_at` se actualiza como máximo una vez por minuto; la migración 018 no se ha podido ejecutar contra un Postgres real en este entorno (revisa los `grant` de columna en staging antes de producción).

## Si algo sale mal

Clave expuesta: revócala en Panel → Desarrolladores (efecto inmediato) y revisa «Últimos cambios». Secretos de plataforma, restauración y moderación: `security/06-runbooks.md`.
