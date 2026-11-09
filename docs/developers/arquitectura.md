# Arquitectura

## Mapa de carpetas

```
src/
  proxy.ts                 Next 16 "proxy" (antes middleware): sesión Supabase, redirige /dashboard, /editor, /admin sin sesión, CSP con nonce
  app/
    page.tsx               Landing (HeroShowcase, LivePreview, demoPage.ts)
    para/[slug], herramientas/[slug]   Páginas SEO por vertical y herramientas QR (estáticas)
    auth/                  Login por magic link (+ callback, signout)
    dashboard/             Panel del cliente (resumen, analíticas, contactos, cobros, planes, ajustes, desarrolladores, QR, sellos, validar entradas)
    editor/[pageId]/       Editor visual de 3 columnas
    p/[slug]/              Página pública + llms.txt, facts.json, contact.vcf
    l/[code], t/[code]     Tarjeta de sellos y entrada de evento (acceso por código no adivinable)
    admin/                 Panel interno de LinkHub (usuarios, páginas, cobros, funciones, bitácora, sistema)
    api/                   Rutas de servidor (ver más abajo)
    robots.ts, sitemap.ts  Solo indexables en producción (staging y previews: disallow total)
  lib/
    blocks/                registry.ts (catálogo de bloques), templates.ts (plantillas de página), summary.ts
    payments/ + payments.ts   Lógica de pasarelas (meta, redsys, eventos, cobro aprobado, historial)
    mcp/                   Servidor MCP y claves de API (lógica pura + cableado a Supabase)
    supabase/              client.ts (navegador), server.ts (cookies), admin.ts (service role)
    seo.ts, knowledge.ts, vcard.ts, appointments.ts, orders.ts, pageWrite.ts, security.ts, flags*.ts, billing*.ts, admin*.ts, crypto.ts, env.ts ...
  hooks/useEditorStore.ts  Estado del editor (Zustand + immer, deshacer/rehacer)
  types/index.ts           Tipos de página/bloques y PLAN_LIMITS
supabase/migrations/       SQL numerado e idempotente
tests/                     node:test (+ tests/helpers)
security/                  Auditoría y plan de remediación
scripts/                   encrypt-existing-tokens.mjs, check-docs.mjs
docs/                      Esta documentación
```

## Modelo de datos

Una página es un **documento JSON**: `pages.blocks` (lista de bloques `{id, type, order, visible, seasonFilter, data}`) y `pages.settings` (idiomas, colores, SEO, perfil, píxeles). No hay una tabla por tipo de bloque.

| Tabla | Contenido | Acceso |
|---|---|---|
| `profiles` | Un perfil por usuario de Auth: `plan` (`free`/`pro`), columnas de Stripe, `billing_lapsed_at` | El usuario lee lo suyo; las columnas de plan/facturación están protegidas (migración 005) |
| `pages` | `slug` único, `name`, `settings`, `blocks`, `published`, `custom_domain`, `moderated_at`, `views` | Dueño: todo (RLS). Público: SELECT si `published` |
| `analytics_events` | `view`/`click` por página y bloque | INSERT público solo en páginas publicadas; el dueño lee |
| `custom_domains`, `email_subscribers`, `tickets`, `loyalty_cards` | Dominios, emails capturados, entradas, tarjetas de sellos | RLS por dueño de la página; tickets y tarjetas sin lectura pública |
| `payment_connections` | Credenciales de pasarela por vendedor (tokens cifrados con `TOKEN_ENCRYPTION_KEY`) | Solo service role |
| `payments`, `payment_events` | Cobros y su traza paso a paso | El dueño de la página lee; escribe el servidor |
| `processed_webhook_events` | Idempotencia de webhooks de Stripe | Solo service role |
| `admin_audit_log` | Acciones de los administradores | Solo service role |
| `feature_flags`, `feature_flag_overrides` | Despliegue gradual por cliente | Solo service role |
| `knowledge_entries` | Base de conocimiento (FAQ/info/política, pública o privada, por página o de toda la cuenta; máx. 300 por cuenta) | El dueño (RLS); lectura pública solo vía servidor |
| `api_keys`, `api_key_audit` | Claves de API (solo hash) y bitácora de lo que escriben | El dueño lee/crea/revoca sus claves; la bitácora solo la escribe el servidor |
| Storage `images` | Imágenes de bloques y perfil | Lectura pública; escritura en la carpeta propia |

Los límites del plan se aplican en **tres capas**: la UI, `evaluatePageWrite()` (`src/lib/pageWrite.ts`) y el *trigger* `enforce_plan_limits` de la base (así llamar a Supabase directo no los salta).

## Página pública (`/p/[slug]`)

`src/app/p/[slug]/page.tsx` carga la página por `slug` + `published = true`, consulta `getOwnerAvailability()` y la renderiza con `PageView`. Es **ISR**: `export const revalidate = 60`, así que un cambio guardado tarda hasta ~60 s en verse (el webhook de Stripe llama a `revalidatePath` cuando cambia el estado de impago). `generateMetadata` produce título, canonical, Open Graph y `robots`; JSON-LD va en un `<script type="application/ld+json">`.

Si el dueño tiene impago vencido, se muestra `PausedPage` y no se aceptan pedidos ni cobros (ver *Impago*). Las rutas auxiliares `llms.txt`, `facts.json` y `contact.vcf` usan `revalidate = 300` y devuelven 404 si la página no está publicada o está pausada (las dos primeras, además, si tiene `seo.noindex`).

## Editor

`/editor/[pageId]` (`EditorShell` + `BlockListPanel` + `EditorPreview` + `PropertiesPanel`). El estado vive en `useEditorStore` (Zustand + immer, con historial). `EditorShell` hace **autosave**: tras un breve retraso envía `PATCH /api/pages` con `{pageId, blocks, settings, name}`; publicar/despublicar es otro `PATCH` con `{pageId, published}`. El servidor no se fía del editor: toda escritura pasa por `src/lib/pageWrite.ts` (forma de los bloques, ≤100 bloques, ≤512 KB, colores hex, plan, flags, saneado de URLs). El mismo módulo lo usan las herramientas de escritura del MCP.

## Panel del cliente (`/dashboard`)

`layout.tsx` exige sesión y pinta `DashNav` (barra lateral en escritorio, barra inferior de 6 destinos en móvil). Las páginas son *server components* que leen con el cliente de sesión (RLS). Las estadísticas usan funciones SQL `owner_daily_stats`, `owner_top_blocks`, `owner_device_stats` (migración 012) y caen a una muestra acotada si no existen (`src/lib/dashboardStats.ts`). El apartado *Desarrolladores* (claves de API) solo aparece con el flag `developer_api`.

## Panel de administración (`/admin`)

Acceso por lista de correos en la variable `ADMIN_EMAILS` (cerrado por defecto: sin variable no entra nadie). Cada ruta `/api/admin/*` revalida en servidor que quien llama es administrador (`requireAdmin()` de `src/lib/admin.server.ts`, o la misma comprobación con `isAdminEmail()` en línea); las acciones relevantes se registran con `audit()` en `admin_audit_log`. Secciones: usuarios (plan, suspensión), páginas (publicar/despublicar por moderación), cobros, funciones (flags), bitácora y sistema (estado de variables de entorno y migraciones).

## Cobros y pasarelas

Tres proveedores: `mercadopago`, `stripe` (Connect) y `redsys`. Catálogo cliente-seguro en `src/lib/payments/meta.ts` (`PROVIDERS`, `supportsCurrency`, `chooseProvider`). Flujo:

1. El botón de la página apunta a `GET /api/pay?pageId&blockId[&tierId]`. `resolvePayable()` (`payments/payable.ts`) deduce **qué se compra y a qué precio solo desde los bloques guardados** (nunca desde la URL) y rechaza páginas no publicadas o pausadas.
2. `chooseProvider()` elige entre las pasarelas conectadas del vendedor según moneda y preferencia del bloque, y redirige a `/api/pay/{provider}`.
3. Conexión del vendedor: `/api/connect/{mercadopago,stripe,redsys}` (OAuth o credenciales). `PROVIDER_FLAG` (`stripe` → `stripe_connect`, `redsys` → `redsys`) hace que el asistente de Cobros solo ofrezca esas pasarelas a quien tenga el flag; hoy se aplica en la interfaz, no en las rutas `/api/connect/*`.
4. Notificaciones: `/api/webhooks/{mercadopago,stripe,stripe-connect,redsys}` verifican firma, cruzan importe y comercio, registran en `payment_events` y llaman a `approvePayment()`/`markPayment()` (`payments/fulfil.ts`). Stripe usa `processed_webhook_events` para la idempotencia.

Los secretos de pasarela se cifran en reposo (`src/lib/crypto.ts`, AES-256-GCM con `TOKEN_ENCRYPTION_KEY`; sin la variable se guardan en claro) y jamás se devuelven por API ni por MCP. Para añadir una: [agregar-una-pasarela-de-pago.md](./agregar-una-pasarela-de-pago.md).

## Flags (funciones por cliente)

`src/lib/flags.ts` declara `FLAGS` (todas nacen **apagadas**): `order_menu_block`, `appointment_block`, `stripe_connect`, `redsys`, `developer_api`. Resolución para un cliente: override individual → «activa para todos» → porcentaje de despliegue (cubo estable por `sha1(flag:userId)`) → valor por defecto del código. Los administradores (`ADMIN_EMAILS`) ven todo. `flags.server.ts` lee las tablas con service role y, si la migración 016 falta, usa los valores por defecto. Se gestionan en `/admin/features`. `BLOCK_FLAG` asocia tipos de bloque a flags: no se puede **añadir** un bloque cuyo flag esté apagado, pero los que ya estaban en la página siguen editables.

## Impago de suscripción (`billing`)

`src/lib/billing.ts` (puro): estados `active` → `grace` → `paused`. El webhook de Stripe fija `profiles.billing_lapsed_at` cuando la suscripción pasa a `past_due`/`unpaid`/`incomplete_expired` y lo limpia al recuperarse. Pasados `BILLING_GRACE_DAYS` (7 por defecto; válido 0–90) la página pública se **pausa**: pantalla neutra, `noindex`, sin pedidos ni cobros, y tampoco se sirve por `llms.txt`, `facts.json`, `contact.vcf` ni por el MCP público. El panel del dueño nunca se bloquea. `getOwnerAvailability()` (`billing.server.ts`) devuelve `active` si la migración 017 no está aplicada.

## Capa SEO / GEO

`src/lib/seo.ts` (pura, con tests): `extractFacts()` aplana los bloques visibles en datos del negocio (contacto, horario, ofertas, carta); `buildStructuredData()` genera JSON-LD schema.org por tipo de negocio (sin `aggregateRating` autodeclarado); `buildLlmsText()` genera Markdown limpio; `defaultMeta()` título/descripción por defecto. Se publica en `/p/{slug}/llms.txt`, `/facts.json` y en el JSON-LD de la página; `contact.vcf` sale de `src/lib/vcard.ts` (escapa campos y pliega líneas). `seo.noindex` saca la página de buscadores y de estas salidas.

## Base de conocimiento

`knowledge_entries` + `src/lib/knowledge.ts` (`validateEntry`, `publicEntriesForPage`, `searchEntries`, `faqPairs`). Las entradas `public` están pensadas para FAQ/JSON-LD/asistentes y las `private` solo para las integraciones del propio dueño. **Estado actual:** existen la tabla, la librería y el acceso por MCP (`list_knowledge`, `upsert_knowledge`, `delete_knowledge`, `search_knowledge`); no hay todavía pantalla de edición en el panel ni se pintan en la página pública.

## Rutas de `src/app/api`

| Ruta | Quién | Función |
|---|---|---|
| `pages` (PATCH, DELETE) | Sesión | Editor: guardar/publicar/borrar página |
| `qr`, `subscribers/export`, `payments/export`, `tickets/validate`, `loyalty/{stamp,redeem}` | Sesión | Utilidades del panel |
| `checkout`, `billing-portal`, `webhooks/stripe` | Sesión / Stripe | Suscripción Pro |
| `pay`, `pay/*`, `connect/*`, `webhooks/*` | Público / vendedor / pasarela | Cobros |
| `admin/*` | Administrador | Planes, suspensión, moderación, flags |
| `health` | Público | Estado para monitores de uptime |
| `mcp` | Público + clave | Servidor MCP ([mcp.md](./mcp.md)) |
| `v1/pages`, `v1/pages/{slug}` | Clave `pages:read` | API REST de lectura |
| `developer/keys` (POST, DELETE) | Sesión | Crear/revocar claves de API desde el panel |

`next.config.ts` añade cabeceras base a todo y `X-Frame-Options: DENY` + `Cache-Control: no-store` a `/dashboard`, `/editor`, `/admin`, `/auth` y `/api/*`. El proxy no protege `/api`: cada ruta se autentica sola. Contrato OpenAPI en `public/openapi.json`.
