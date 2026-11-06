# Changelog

Formato: más reciente primero. Cada cambio en rutas, migraciones, variables, bloques, flags, herramientas MCP o pasarelas debe añadir aquí una entrada (ver «Política de documentación» en `AGENTS.md`).

## 2026-11-06 — Inicio de sesión: causa del fallo y diagnóstico

**Causa** (primera prueba): el enlace mágico llevaba a `https://linkhub-pi.vercel.app/?code=…`. La URL de la preview no estaba en las *Redirect URLs* de Supabase, que cae al Site URL (producción, con el código viejo). Se arregla en Supabase; ver `docs/operacion/login.md`.

**Añadido**
- `/auth/callback` distingue caducado / otro navegador / denegado y lo muestra en `/auth`; nueva ruta `/auth/confirm` (verificación por `token_hash`, no depende del navegador de origen).
- `proxy.ts` reenvía `/?code=…` a `/auth/callback` y no tumba el sitio si faltan las variables de Supabase. `GET /api/health` incluye `auth`.

## 2026-11-06 — Portada visible en el editor

**Cambiado**
- La foto de portada ya existía (Diseño y ajustes → Cabecera), pero estaba escondida. Ahora la cabecera del lienzo del editor muestra un botón «Añadir foto de portada» / «Cambiar portada» que abre ese campo (también en móvil).

## 2026-11-06 — Demo interactiva y pantalla de acceso nueva

**Cambiado**
- Landing: la demo («Pruébalo ahora») deja de ser un mockup inerte: se elige sector, nombre, color y módulos, y la página de la derecha es la real en modo vista previa (se puede pedir cita o armar un pedido; no se envía nada). Nueva escena «Deja de repetir las mismas respuestas» (conversación animada) y cinta de sectores; fondo cálido en el hero.
- `/auth` rediseñada: panel de marca en escritorio, formulario con etiqueta visible y autocompletado, estado «Revisa tu correo» con acceso directo al buzón (Gmail, Outlook, Yahoo, iCloud), reenvío con cuenta atrás de 30 s, «Usar otro correo» y errores en línea.

## 2026-11-06 — Landing v2

**Cambiado**
- Franja de cifras bajo el hero, banda oscura «Cómo funciona» y ejemplos con descripción. Documento `docs/estrategia/landing-v2.md` (posicionamiento y dirección de arte).
- **Corregido:** la landing, los precios y la pantalla de plan prometían «dominio propio», que aún no existe; ahora figura como «en estudio». «Páginas reales» pasa a «ejemplos con datos ficticios».
- El correo de contacto sale de `src/lib/contact.ts` (`NEXT_PUBLIC_SUPPORT_EMAIL`, por defecto `hola@linkhub.johelpastorino.com`) en lugar de `hola@linkhub.app`.

## 2026-11-06 — Próximamente y votos

**Añadido**
- Lista de funciones en estudio en `src/lib/roadmap.ts` (dominio propio, citas con calendario, facturas, Google Business, recordatorios por WhatsApp, equipo). Se muestra en la landing («Escuchamos tus necesidades»), en el panel del cliente (`/dashboard/roadmap`, también desde Ajustes) y con recuento de votos en `/admin/features`.
- **Migración 020** (`roadmap_votes`): cada cliente ve y gestiona solo sus votos (RLS), máximo 10 por cuenta; los totales solo los lee el servidor con la service role. Ruta `POST /api/roadmap/vote`.
- `/admin/system` ahora comprueba también las migraciones 017–020.

## 2026-11-06 — Hero de la landing y pantalla de acceso

**Cambiado**
- Hero de la landing: titular que aparece palabra a palabra con subrayado animado en «sin necesidad de una web», móvil que entra con un giro suave, tres tarjetas flotantes (cita, pedido, cobro) en escritorio, resplandor de fondo y línea de pasarelas. Todo el movimiento se desactiva con `prefers-reduced-motion`.
- Pantalla de acceso (`/auth`): enlace a términos corregido (apuntaba a `/terms`, que no existe; ahora `/legal/terminos` y privacidad), mensajes de error en español (límite de correos, correo inválido, acceso no disponible), aviso cuando el enlace de acceso falla (`?error=callback`) y textos en tuteo neutro.

## 2026-11-06 — Onboarding guiado con IA («Crear con IA»)

**Añadido**
- Flag `ai_onboarding` (apagado por defecto; los administradores siempre lo ven). Con él, «Nueva página» ofrece «Crear con IA»: el cliente describe su negocio y recibe una propuesta (eslogan, presentación, servicios, preguntas frecuentes, tipo schema.org y color) que puede revisar antes de crear la página. Las preguntas frecuentes se guardan en la base de conocimiento.
- `POST /api/ai/draft` (`src/app/api/ai/draft/route.ts`): requiere sesión y el flag, límite de 5 propuestas/hora/usuario por instancia, salida estructurada (JSON Schema) y saneado en `src/lib/aiDraft.ts`. Sin `ANTHROPIC_API_KEY`, o si falla/rechaza, devuelve una base sencilla sin IA (`source: "basic"`).
- Variables `ANTHROPIC_API_KEY` y `AI_MODEL` (por defecto `claude-opus-5-5`). Dependencia `@anthropic-ai/sdk`.

## 2026-11-06 — Fiabilidad y alertas

**Añadido**
- `reportError` (`src/lib/observability.ts`) con variable `ALERT_WEBHOOK_URL`, aplicado a los webhooks de pagos; `src/lib/alerting.ts` (tachado de secretos y deduplicado).
- `error.tsx` y `global-error.tsx`; workflow `uptime.yml` (variable de repo `HEALTHCHECK_URL`); guía `docs/operacion/fiabilidad.md`.
- El webhook de Stripe envía los correos de pago fallido y regularizado al empezar/terminar el periodo de gracia.

## 2026-11-06 — Páginas legales y consentimiento de cookies

**Añadido**
- Páginas `/legal/privacidad`, `/legal/terminos` y `/legal/cookies` (borradores: faltan los datos del titular y revisión legal por mercado) y enlaces en el pie de la landing y el sitemap.
- `TrackingConsent` en páginas públicas: GA4 y Meta Pixel de los clientes solo se cargan tras pulsar «Aceptar» (clave `lh_tracking_consent` en localStorage). Se elimina el `<noscript>` del píxel de Meta, que omitía el consentimiento.

## 2026-11-06 — Emails de la plataforma con identidad propia

**Añadido**
- Sistema único de emails: `src/lib/emailLayout.ts` (maqueta) y `src/lib/emailTemplates.ts` (plantillas). Seis plantillas de Supabase Auth (enlace mágico, confirmación, invitación, recuperación, cambio de correo, código de reautenticación) en español neutro, sin emojis ni imágenes; versión en texto plano.
- Emails transaccionales nuevos: pago fallido y pago regularizado (`sendPaymentFailedEmail`, `sendPaymentRecoveredEmail`; **aún sin conectar al webhook de facturación**). `sendTicketEmail` usa el nuevo diseño y escapa el texto dinámico.
- `npm run emails:build` regenera `supabase/email-templates/*.html`; `npm run emails:push` las sube a Supabase por la Management API (`--apply`; sin verificar contra la API real, probar primero en staging).
- Variable `SUPPORT_EMAIL` (pie de los correos). `RESEND_FROM_EMAIL` pasa a ser obligatoria en producción.

## 2026-11-06 — Servidor MCP, API keys y documentación para desarrolladores

**Añadido**
- Servidor MCP en `POST /api/mcp` (Streamable HTTP sin estado, JSON-RPC 2.0). Nivel público (sin clave, solo lectura): `get_business`, `list_offers`, `search_knowledge`, `get_availability`, `create_booking_link`, `create_order_link`, `get_contact`, más recursos `linkhub://page/{slug}` y `…/facts`. Nivel cliente (clave `lh_…`): `list_my_pages`, `get_my_page`, `update_page_settings`, `update_block`, `list_knowledge`, `upsert_knowledge`, `delete_knowledge`, `get_analytics_summary`, `list_payments`. Ver `docs/developers/mcp.md`.
- API keys con scopes `pages:read`, `pages:write`, `knowledge:read`, `knowledge:write`, `analytics:read`, `payments:read`. **Migración 018** (`api_keys`, `api_key_audit`). Ruta `/api/developer/keys` y pantalla `/dashboard/developers` («Desarrolladores»; en móvil se enlaza desde Ajustes).
- API REST de lectura `GET /api/v1/pages` y `GET /api/v1/pages/{slug}`; contrato en `public/openapi.json`.
- Flag `developer_api` (apagado por defecto) que gobierna la creación de claves y todo uso autenticado.
- `src/lib/pageWrite.ts`: validación, límites de plan, flags y saneado de escritura de páginas, compartido por `PATCH /api/pages` y el MCP (sin cambios de comportamiento en la ruta).
- Documentación en `docs/developers/`, `scripts/check-docs.mjs` y paso consultivo en CI; «Política de documentación» en `AGENTS.md`.

**Notas de despliegue**
- Aplicar la migración 018 antes de activar el flag `developer_api` para ningún cliente.
- Límites de uso en memoria por instancia (ver `docs/developers/mcp.md#límites`). Sin variables de entorno nuevas.
