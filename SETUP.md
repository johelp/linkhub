# LinkHub — Cuentas y puesta en marcha

Checklist de todo lo que hace falta para tener el proyecto corriendo en producción, y cómo cargarlo.

## 1. Cuentas necesarias

| Servicio | Para qué | Plan mínimo | Obligatorio |
|---|---|---|---|
| [Supabase](https://supabase.com) | DB Postgres + Auth (magic link) + Storage | Free (o Pro cuando haya tráfico real) | Sí |
| Hosting: [Vercel](https://vercel.com) o [Railway](https://railway.app) | Deploy de la app Next.js | Ya tenés Railway pago | Sí (uno de los dos) |
| Dominio propio (ej. `linkhub.app`) | URL final del producto | — | Recomendado antes de lanzar |
| [Stripe](https://stripe.com) | Cobro del plan Pro | — | Sí, para activar pagos reales (ver §6) |

No hace falta cuenta de email transaccional aparte para el resto del proyecto — **pero el magic link sí necesita SMTP propio antes de tener tráfico real, no es opcional**: el servicio de email incluido de Supabase manda como máximo **2 emails por hora, en total, para todo el proyecto** (no por usuario), pensado por Supabase solo para pruebas. Con más de un par de personas iniciando sesión en la misma hora, el resto se queda sin poder entrar. Ver §16.

## 2. Variables de entorno

Copiá `.env.local.example` a `.env.local` y completá:

```
NEXT_PUBLIC_SUPABASE_URL=          # Supabase → Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase → Project Settings → API (anon/public)
SUPABASE_SERVICE_ROLE_KEY=         # Supabase → Project Settings → API (service_role — SECRETO, nunca al cliente)

NEXT_PUBLIC_APP_URL=               # URL pública final (https://tu-dominio.com)
NEXT_PUBLIC_APP_NAME=LinkHub

# Stripe — ver §6 para cómo obtener cada valor:
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=

# Mercado Pago — ver §7 para cómo obtener cada valor:
MERCADOPAGO_CLIENT_ID=
MERCADOPAGO_CLIENT_SECRET=
MERCADOPAGO_WEBHOOK_SECRET=
```

⚠️ **Importante:** `SUPABASE_SERVICE_ROLE_KEY` bypasea todos los permisos (RLS) de la base. Nunca lo expongas al cliente ni lo commitees. Lo usa `src/lib/supabase/admin.ts`, importado únicamente por el webhook de Stripe (`/api/webhooks/stripe`) para actualizar `profiles.plan` sin sesión de usuario — no lo importes desde ningún componente cliente ni ruta que no sea de confianza.

## 3. Base de datos (Supabase)

En el SQL Editor de Supabase, correr en orden:

1. `supabase/migrations/001_initial_schema.sql` — esquema completo (profiles, pages, analytics_events, custom_domains, RLS).
2. `supabase/migrations/002_plan_enforcement_and_views.sql` — corrige el contador de vistas (nunca se incrementaba) y agrega el enforcement de límites de plan a nivel de base de datos (no se podía bypasear el gating de bloques Pro llamando la API de Supabase directo).
3. `supabase/migrations/003_two_plan_tiers.sql` — colapsa a 2 planes (`free`/`pro`); migra cualquier cuenta `agency` existente a `pro` y ajusta el `check` constraint.
4. `supabase/migrations/004_stripe_billing.sql` — agrega `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status` a `profiles`, que usa el webhook de Stripe.
5. `supabase/migrations/005_protect_billing_columns.sql` — **crítica, corre esta sí o sí**: sin ella, cualquier usuario logueado puede ponerse `plan = 'pro'` a sí mismo llamando a Supabase directo desde el navegador, sin pasar por Stripe (ver aviso de seguridad abajo).
6. `supabase/migrations/006_email_capture.sql` — tabla `email_subscribers` para el bloque de captura de email.
7. `supabase/migrations/007_mercadopago_connect.sql` — tablas `payment_connections` (tokens OAuth, sin acceso desde el navegador ni para el dueño) y `payments` (log de cobros) para el bloque de Mercado Pago.
8. `supabase/migrations/008_event_tickets.sql` — tabla `tickets` (sin acceso público de lectura, mismo criterio que `payment_connections`) y columnas `tier_id`/`tier_name` en `payments`, para el bloque de entradas a eventos.
9. `supabase/migrations/009_loyalty_cards.sql` — tabla `loyalty_cards` (sin acceso público de lectura, mismo criterio que `tickets`) para el bloque "Tarjeta de sellos".

**Auth → URL Configuration:**
- Site URL: tu dominio de producción
- Redirect URLs: agregar `https://tu-dominio.com/auth/callback` (y `http://localhost:3000/auth/callback` para desarrollo)

## 4. Deploy

### Opción A — Vercel (lo que ya está configurado: `vercel.json`)
1. Import del repo en vercel.com
2. Cargar las env vars de la sección 2
3. Deploy

### Opción B — Railway (tenés cuenta paga)
Next.js corre sin problema en Railway como servicio Node normal:
1. New Project → Deploy from GitHub repo → seleccionar `linkhub`
2. Railway detecta Next.js automáticamente (Nixpacks) y corre `npm run build` + `npm run start`
3. Settings → Variables: cargar las env vars de la sección 2 (Railway inyecta `PORT` solo, Next.js lo respeta)
4. Settings → Networking → Generate Domain (o conectar dominio propio)

Diferencias a tener en cuenta si vas por Railway en vez de Vercel:
- `vercel.json` (headers de seguridad en `/p/:slug*` y CORS en `/api/:path*`) es específico de Vercel y **se ignora** en Railway. Esos mismos headers ya están duplicados en `next.config.ts` (`headers()`), que sí es framework-agnostic y aplica en cualquier hosting — no hace falta portar nada, ya está cubierto ahí. El único que falta portar es el header CORS de `/api/:path*` de `vercel.json`, que no está en `next.config.ts` (lo agrego si confirmás que lo necesitás — hoy ninguna API se llama desde otro origen).
- No hay Image Optimization CDN ni Edge Network global como en Vercel; para este proyecto no es crítico (páginas públicas livianas, sin `next/image` optimizando imágenes de usuario todavía).
- ISR (`revalidate = 60` en `/p/[slug]`) funciona igual en un contenedor persistente Railway — el cache vive en el filesystem del contenedor en vez de la edge network de Vercel.

## 5. Rotación de credenciales (acción pendiente — ver aviso de seguridad)

El commit `c8a5f31` en `main` subió credenciales reales de Supabase (anon key + **service role key**) al `.env.local.example`. Ya lo limpié en esta rama, pero:
1. Andá a Supabase → Project Settings → API → **Reset** el `service_role` key (y considerá resetear el `anon` key también).
2. Actualizá las env vars en Vercel/Railway con las nuevas keys.
3. Revisá los logs de la base por actividad sospechosa mientras estuvo expuesta.

### ⚠️ Segundo hallazgo (detectado en revisión automatizada de seguridad, ya corregido en el código — falta que corras la migración)

La política RLS `"Users can update own profile"` (`001_initial_schema.sql`) permite `update` sobre **cualquier columna** de la propia fila, no solo las pensadas para que el usuario edite (nombre, avatar). Postgres RLS restringe filas, no columnas. Antes de la migración 005, cualquier usuario logueado podía ejecutar esto desde la consola del navegador y quedar en plan Pro gratis, sin tocar Stripe:

```js
await supabase.from('profiles').update({ plan: 'pro' }).eq('id', miPropioId)
```

Se corrigió con un trigger (`005_protect_billing_columns.sql`) que bloquea cambios a `plan`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status` y `plan_expires_at` cuando la request viene de una sesión de usuario normal — solo el webhook de Stripe (service role) o vos corriendo SQL directo pueden tocarlos. **Corré esa migración antes de anunciar que Stripe está activo**, si no cualquiera puede saltarse el pago.

## 6. Stripe — activar pagos reales

El código ya está: Checkout Session (`/api/checkout`), portal de facturación para cancelar/cambiar tarjeta (`/api/billing-portal`), y el webhook que sincroniza el estado (`/api/webhooks/stripe`). Lo que falta es configurar tu cuenta de Stripe y cargar 4 env vars — no lo pude probar en vivo en esta sesión porque no tengo tus keys, así que probalo end-to-end en modo test antes de pasar a producción.

1. **Crear el producto y precio**: Stripe Dashboard → Product catalog → Add product → "LinkHub Pro", precio recurrente mensual €19 → copiá el **Price ID** (`price_...`) → `STRIPE_PRICE_ID_PRO`.
2. **API keys**: Developers → API keys → copiá la Secret key (`sk_test_...` en modo test) → `STRIPE_SECRET_KEY`, y la Publishable key (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (hoy solo se usa para decidir si mostrar el botón de pago o "Próximamente" en `/dashboard/upgrade` — si más adelante embebés Stripe.js en vez de redirigir al Checkout alojado, ahí se vuelve imprescindible).
3. **Webhook**: Developers → Webhooks → Add endpoint → URL: `https://tu-dominio.com/api/webhooks/stripe` → eventos a escuchar: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → copiá el **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.
4. Probar en modo test con una [tarjeta de prueba](https://docs.stripe.com/testing) (`4242 4242 4242 4242`, cualquier fecha futura/CVC): registrate, andá a `/dashboard/upgrade`, "Empezar Pro", completá el checkout, y confirmá que `profiles.plan` pasó a `pro` (mirá los logs del webhook en Stripe Dashboard → Developers → Webhooks → tu endpoint, para ver si el evento llegó y qué devolvió).
5. Para probar el webhook en local antes de tener dominio: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (Stripe CLI) te da un `whsec_...` temporal para `.env.local`.

Notas:
- Mientras `STRIPE_PRICE_ID_PRO` no esté seteado, `/api/checkout` devuelve un 503 controlado y el botón en `/dashboard/upgrade` muestra "Próximamente" — no rompe nada tenerlo sin configurar.
- El webhook usa `SUPABASE_SERVICE_ROLE_KEY` (bypasea RLS) porque Stripe le pega sin sesión de usuario — es el único lugar del código que la usa.
- Downgrade automático: cuando Stripe cancela o marca `unpaid`/`incomplete_expired` la suscripción, el webhook baja `profiles.plan` a `free` solo. No borra páginas ni bloques existentes — si el usuario tenía 5 páginas con bloques Pro y vuelve a Free, esas páginas siguen existiendo tal cual (el trigger de plan solo bloquea *nuevas* ediciones que excedan el límite Free, no retroactivamente). Si más adelante querés otra política (ej. despublicar automáticamente lo que excede el límite), es un cambio a decidir aparte.

## 7. Mercado Pago — activar el bloque "Cobrar"

Igual que con Stripe: el código está completo (conexión OAuth, creación de pagos, webhook), pero no lo pude probar contra la API real de Mercado Pago en esta sesión — no tengo tus credenciales. Es una integración distinta a Stripe: acá LinkHub **no cobra en nombre tuyo**, cada usuario conecta su propia cuenta de Mercado Pago y el dinero va directo a esa cuenta — LinkHub nunca toca la plata ni ve la contraseña, solo pide permiso (OAuth) para generar links de cobro en su nombre.

1. **Crear una aplicación de Mercado Pago**: [mercadopago.com/developers](https://www.mercadopago.com.ar/developers/panel) → Tus integraciones → Crear aplicación → elegí "Marketplace/Checkout Pro" como modelo de integración (es el que permite conectar cuentas de otros usuarios vía OAuth). Copiá el **Client ID** → `MERCADOPAGO_CLIENT_ID` y el **Client Secret** → `MERCADOPAGO_CLIENT_SECRET`.
2. **Redirect URI**: en la configuración de la aplicación, agregá `https://tu-dominio.com/api/connect/mercadopago/callback` (y `http://localhost:3000/api/connect/mercadopago/callback` para probar en local) a la lista de URIs de redirección permitidas.
3. **Webhook**: en la misma aplicación → Webhooks → configurá la notificación para el evento `payments`, apuntando a `https://tu-dominio.com/api/webhooks/mercadopago` (la URL real que reciben tiene además `?ref=...` agregado dinámicamente por cada cobro, eso es normal). Copiá la **clave secreta** que te muestran ahí → `MERCADOPAGO_WEBHOOK_SECRET`.
4. Un usuario conecta su cuenta desde `/dashboard/settings` → "Conectar Mercado Pago". Después puede agregar el bloque "Cobrar (Mercado Pago)" en el editor con un precio y moneda.
5. Probar en modo sandbox: Mercado Pago tiene [usuarios y tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/accounts) separados por país — necesitás crear un usuario de prueba "vendedor" (el que conecta la cuenta) y uno "comprador" (el que paga) desde el panel de developers.
6. **Opcional — comisión de LinkHub por venta**: como la aplicación ya es de tipo "Marketplace", Mercado Pago permite quedarte con un porcentaje fijo de cada cobro (bloque "Cobrar" y entradas de evento) sin que el vendedor tenga que pagarte aparte — se lo descuenta automáticamente Mercado Pago del pago antes de acreditarlo (mecanismo [Split Payments 1:1](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/overview)). Está **desactivado por defecto** — sin `MERCADOPAGO_PLATFORM_FEE_PERCENT` en el entorno, no se cobra ninguna comisión y nada cambia. Para activarlo, poné un número de 0 a 100 (ej. `MERCADOPAGO_PLATFORM_FEE_PERCENT=5` para 5%). Antes de activarlo: definí el % y avisale a tus usuarios que existe (transparencia con quien vende), ya que hoy no hay ningún aviso en el editor ni en el checkout sobre esto — es puramente un parámetro de servidor.

Notas:
- La tabla `payment_connections` (que guarda el access token de cada usuario) **no es accesible desde el navegador ni con el usuario logueado** — ni siquiera el dueño puede leer su propio token vía RLS. Todo pasa por rutas del servidor con el cliente de service role. Esto es a propósito, después de lo que encontramos en el punto 5 de arriba: nunca hay que confiar en que "el dueño puede ver su fila" sea seguro cuando la fila tiene un secreto adentro.
- El webhook verifica la firma `x-signature` (HMAC-SHA256) antes de confiar en cualquier notificación — sin `MERCADOPAGO_WEBHOOK_SECRET` configurado, el endpoint devuelve 503 en vez de aceptar eventos sin validar.
- El precio del bloque se usa para generar una preferencia de pago **en el momento en que alguien hace click**, no al guardar el bloque — así que si cambiás el precio, el link ya generado antes deja de existir pero uno nuevo generado por un click posterior usa el precio actualizado. No hay links de cobro "cacheados" que puedan quedar desactualizados.
- Si un negocio no conectó Mercado Pago todavía y alguien hace click en el bloque de todos modos, el visitante ve un error claro en vez de un cobro roto a medias.
- El webhook además valida que el `external_reference` que devuelve la API de Mercado Pago coincida con el `ref` que vino en la URL de notificación, antes de marcar cualquier pago como aprobado (lo sumé después de una revisión de seguridad automatizada — sin esto, el `ref` de la URL no estaba atado a nada que Mercado Pago hubiera firmado).

## 8. Entradas a eventos (email + QR de validación)

Sobre el bloque "Cobrar" de Mercado Pago: el bloque "Entradas a evento" permite 2-3 tipos de entrada con precios distintos. Cuando se aprueba un pago, el webhook genera un ticket numerado y (si Resend está configurado) manda un email con un link a `/t/[código]` que muestra el QR para presentar en la puerta.

1. **Crear cuenta en [resend.com](https://resend.com)** → API Keys → copiá la key → `RESEND_API_KEY`.
2. **Remitente**: mientras no verifiques un dominio propio en Resend, solo podés mandar desde `onboarding@resend.dev` (el default de `RESEND_FROM_EMAIL` ya apunta ahí) y solo a la dirección con la que te registraste en Resend — para mandarle tickets a compradores reales hace falta verificar tu propio dominio en Resend → Domains, y después sí poner `RESEND_FROM_EMAIL=Tu Negocio <tickets@tudominio.com>`.
3. Sin `RESEND_API_KEY` configurada, los tickets se siguen generando igual (el negocio los ve en `/dashboard/validate/[pageId]`) pero no se manda el email — no rompe el flujo de pago, solo no avisa al comprador.
4. **Validar entradas en la puerta**: `/dashboard/validate/[pageId]` (ícono 🎫 en cada página del dashboard) — funciona con cualquier lector de QR externo (te muestra el código como texto, lo pegás ahí) o tipeando el código a mano. Marca la entrada como usada de forma atómica, así que dos personas validando al mismo tiempo no pueden dejar pasar el mismo ticket dos veces.
5. La tabla `tickets` tampoco tiene política de lectura pública en Supabase (mismo criterio que `payment_connections`): la página `/t/[código]` la consulta con el cliente de service role, filtrando siempre por el código exacto de la URL — nunca una lista sin filtrar. El código en sí es de alta entropía (10 caracteres, ~60 bits), tratado como un secreto no adivinable, igual que un link no listado.

## 9. Dar plan Pro gratis a los primeros clientes (manual)

Antes de tener Stripe funcionando, o para casos puntuales aunque ya lo tengas: Supabase → SQL Editor →

```sql
-- Por email (más práctico que buscar el UUID a mano)
update public.profiles
set plan = 'pro',
    plan_expires_at = null                      -- null = no vence; o poné una fecha ej. '2027-03-01'
where email = 'cliente@ejemplo.com';
```

Para ver quién tiene qué plan hoy:
```sql
select email, plan, plan_expires_at, created_at from public.profiles order by created_at desc;
```

Notas:
- `plan_expires_at` hoy es solo informativo — no hay ningún cron/trigger que degrade el plan automáticamente al vencer. Si vas a dar planes "por 3 meses gratis", hace falta un job que revise `plan_expires_at` y baje a `free` cuando pase la fecha (no existe todavía; lo puedo armar si lo necesitás — un Supabase Cron Job o una Edge Function corren bien para esto).
- El trigger de la migración 002 (`enforce_plan_limits`) lee `profiles.plan` en cada guardado de página, así que el cambio aplica al toque, sin reiniciar nada.
- Si más adelante armás muchos códigos promocionales, conviene pasar esto a una tabla `promo_codes` + un flujo en `/dashboard/upgrade` en vez de tocar SQL a mano cada vez — lo dejamos para cuando el volumen lo justifique.

## 10. Nota documentada: creadores de contenido (OnlyFans y similares) como público objetivo

Quedó planteado como posible público a futuro, sin construir nada todavía por decisión explícita (foco actual: dejar la base funcional). Cuando se retome, la conversación tuvo estas ideas sobre la mesa — quedan documentadas para no perderlas:

- **Gate de +18 / contenido sensible**: splash de verificación de edad antes de mostrar la página pública, con un flag `sensitive` a nivel página.
- **Bloque "suscripción paga"**: un tipo de bloque nuevo, tipo botón premium con preview bloqueada/blur, pensado para enlazar a OnlyFans/Fansly/Fanvue u otras plataformas de suscripción.
- **Blur por bloque**: toggle "contenido sensible" en cualquier bloque existente, que lo muestra difuminado hasta que el visitante confirma ser mayor de edad.

Cosas a resolver *antes* de construir esto (no son solo feature work):
- Términos de servicio / política de contenido: LinkHub pasaría a alojar links hacia contenido para adultos, lo cual tiene implicancias legales y de moderación que hoy el proyecto no contempla (no hay ToS ni política de uso aceptable en el repo).
- Revisar los Términos de Servicio de Vercel/Railway y de la pasarela de pago que se use — varios prohíben o restringen explícitamente alojar/facturar contenido para adultos.
- Puede requerir un plan/tier de precio distinto y verificación de identidad del creador (KYC), no solo del visitante.

## 11. Poner el repo en privado

No tengo forma de hacerlo por acá — la integración de GitHub que uso no expone cambiar la visibilidad de un repo existente (solo puedo leer/escribir código, crear ramas y PRs). Lo hacés vos en 30 segundos:

1. `github.com/johelp/linkhub` → **Settings** → scroll hasta el final → **Danger Zone** → **Change repository visibility** → **Make private**.
2. Ojo con lo que dependa de que el repo sea público: si Vercel/Railway están conectados vía la GitHub App, en general el deploy sigue funcionando igual porque ya tienen permiso otorgado sobre el repo puntual — pero si en algún momento pierden acceso, hay que re-autorizar la app para repos privados desde la configuración de la integración.
3. Dado que hubo una clave real filtrada en el historial (ver §5), pasar a privado reduce la superficie pero **no reemplaza rotar la key** — alguien que ya haya clonado el repo en la ventana en que fue público se la lleva igual.

## 12. Google Analytics 4 y Meta Pixel (por página, plan Pro)

No requiere ninguna cuenta ni variable de entorno del lado de LinkHub — es una configuración que carga cada usuario Pro desde el editor de su propia página (pestaña **Ajustes → Integraciones**), con sus propios IDs:

1. **GA4**: Google Analytics → Administrar → Flujos de datos → Web → copiar el **ID de medición** (`G-XXXXXXXXXX`).
2. **Meta Pixel**: Administrador de eventos de Meta → Conectar fuentes de datos → Web → copiar el **ID del píxel** (numérico).
3. Pegar cada uno en el campo correspondiente del editor. Se valida el formato antes de inyectar nada en la página pública (si no matchea el patrón esperado, no se carga el script — no hay forma de meter código propio ahí).
4. Sirve para armar públicos de remarketing y medir conversión de campañas pagas (Meta/Google Ads) sobre visitas y clics de la página pública — es aparte del analytics interno que ya trae LinkHub (vistas/clics en el dashboard).
5. Gateado al plan Pro (mismo límite que el resto de analítica avanzada, `PLAN_LIMITS.analytics`).

## 13. Programa de afiliados (Endorsely)

Se evaluaron alternativas (Rewardful, Tapfiliate, sistema propio) — se eligió **Endorsely** porque es gratis mientras el volumen generado por afiliados sea bajo (confirmar el umbral vigente en [endorsely.com/pricing](https://www.endorsely.com/pricing) antes de decidir, las fuentes consultadas no coincidían en el número exacto), se conecta a Stripe con la misma facilidad, y paga a los afiliados por PayPal en lote automático.

**Estado del código**: solo la mitad está armada.
- ✅ El script de tracking (`src/app/layout.tsx`, gateado por `NEXT_PUBLIC_ENDORSELY_ORG_ID` — sin esa env var, cero cambio de comportamiento) y la captura del referral del lado del cliente (`UpgradeButton.tsx` lee `window.endorsely_referral` y lo manda a `/api/checkout`).
- 🔲 **Falta el último paso**: reportarle ese referral a Endorsely para que quede asociado a la suscripción. Endorsely usa una llamada de servidor a servidor con un API secret propio (no la metadata del customer de Stripe, que es el patrón de otras herramientas como Rewardful) — no se implementó a ciegas para no arriesgar una integración que falla en silencio y nunca le paga comisión a nadie. `/api/checkout/route.ts` tiene un comentario `TODO(afiliados/Endorsely)` marcando exactamente dónde va.

Pasos para terminarlo:
1. **Crear cuenta en [endorsely.com](https://www.endorsely.com/)** y conectar tu cuenta de Stripe en un clic.
2. **Definir la regla de recompensa**: comisión recurrente, de por vida, sin techo de ganancias — opción de configuración en el panel, no algo que haya que construir.
3. **Copiar tu Organization ID** (lo que pide `data-endorsely` en el script) → `NEXT_PUBLIC_ENDORSELY_ORG_ID` en Vercel.
4. Endorsely, al conectar Stripe, te muestra el snippet exacto para el paso del checkout server-side (con tu API secret real) — **pegame ese snippet en la próxima sesión** y termino de cablear el `TODO` de `/api/checkout/route.ts` con los datos reales en vez de adivinarlos.
5. **Pago a afiliados**: por PayPal, en lote, directo desde Endorsely — cada afiliado carga su email de PayPal en su propio panel.
6. Probar una vez completo el paso 4: abrí el sitio con el link de afiliado de prueba que te da Endorsely, confirmá en la consola del navegador que `window.endorsely_referral` tiene un valor, registrate, hacé "Empezar Pro" con una tarjeta de prueba de Stripe, y confirmá en el panel de Endorsely que apareció el referido.

Notas:
- No reemplaza nada de la integración de Stripe que ya existe (§6) — se apoya en ella.
- El script se inyecta en todo el sitio (no solo el home) porque un afiliado puede compartir el link de cualquier página pública, y Endorsely necesita ver esa visita para asociar el referido antes de que la persona se registre.

## 14. Páginas SEO (`/herramientas`)

Generadores de QR gratis y sin registro (WiFi, Instagram, tarjeta de contacto/vCard) en `/herramientas/[slug]`, pensados para atraer tráfico de búsqueda con utilidad real por página (no una landing genérica repetida) — ver `src/lib/qrTools.ts`. Para sumar una nueva variante: agregar una entrada a `QR_TOOLS` con su propio `kind` de payload en `qrTools.ts`, y el caso correspondiente en `QrToolClient.tsx` si el formato de QR es nuevo. Antes de publicar una nueva variante, chequeá que resuelva una necesidad real y distinta — páginas que solo cambian el título sin aportar nada propio son exactamente lo que Google trata como spam.

## 15. Páginas SEO por rubro (`/para`)

Tableros de enlaces posicionados por tipo de comercio (peluquerías, bares y cafeterías, restaurantes, eventos, turismo) en `/para/[slug]`, cada una con la demo real de ese rubro (el mismo `PageView` que la página pública, no una captura) — ver `src/lib/verticals.ts`. Para sumar un rubro nuevo: una entrada en `VERTICALS` con su propia página de ejemplo en `src/app/demoPage.ts` (reusar el patrón `buildXExample()`) y highlights atados a bloques que existan de verdad — no vale duplicar copy genérico entre rubros.

## 16. Email de magic link (acceso sin contraseña)

El login (`AuthForm.tsx` → `supabase.auth.signInWithOtp`) lo manda **Supabase Auth directamente**, no el código de LinkHub — ni pasa por Resend ni por `src/lib/email.ts` (eso solo manda los emails de entradas a eventos). Por eso este template y este SMTP se configuran en el Dashboard de Supabase, no en Vercel ni en el repo.

### 16.1 — Por qué esto es urgente, no cosmético

El servicio de email incluido de Supabase está limitado a **2 emails por hora, en total, para todo el proyecto** (no 2 por usuario) — está pensado por Supabase solo para probar templates, no para producción. Ni bien un puñado de personas pruebe LinkHub en la misma hora, la mayoría no va a poder entrar y no vas a ver ningún error claro del lado de la app, el login simplemente "no llega". Antes de invitar testers, hace falta SMTP propio.

### 16.2 — Configurar SMTP con Resend (ya lo tenés dado de alta para las entradas, § 8)

1. Supabase Dashboard → **Authentication → Sign In / Providers → SMTP Settings** (o **Authentication → Settings**, el nombre exacto varía un poco entre versiones del dashboard) → activar **Enable Custom SMTP**.
2. Cargar:
   - **Host**: `smtp.resend.com`
   - **Port**: `465`
   - **Username**: `resend` (literal, en minúscula)
   - **Password**: tu `RESEND_API_KEY` completa (con el prefijo `re_`)
   - **Sender email**: mientras no verifiques un dominio propio en Resend, tiene que ser `onboarding@resend.dev` (mismo límite que ya vale para las entradas, ver § 8) — con dominio propio verificado en Resend, poné algo como `LinkHub <acceso@tudominio.com>`.
   - **Sender name**: `LinkHub`
3. Guardar y mandar un login de prueba — con SMTP propio activo, el límite sube a 30 emails/hora por defecto (ajustable en Auth → Rate Limits).

### 16.3 — Reemplazar el template del email

Supabase → **Authentication → Email Templates → Magic Link**. Reemplazar el HTML por el de [`supabase/email-templates/magic-link.html`](../supabase/email-templates/magic-link.html) (en este repo) — con la identidad visual de LinkHub en vez del template genérico de Supabase, usando las variables reales del proyecto (`{{ .Email }}`, `{{ .ConfirmationURL }}`). Subject sugerido: `Tu link de acceso a LinkHub`.

Notas:
- El layout usa tablas y estilos inline a propósito — es lo único que Gmail/Outlook renderizan bien; un `<link>` a una fuente externa o un `<style>` en el `<head>` se ignora en buena parte de los clientes de email.
- Para tocar el diseño más adelante, editá el `.html` del repo (queda como referencia versionada) y pegalo de nuevo en el dashboard — Supabase no lee el archivo del repo automáticamente, es copiar/pegar cada vez.
- Probar en al menos Gmail y el cliente de mail del celular antes de darlo por bueno — el renderizado de emails varía más que el de una página web.

## 17. Panel de administrador (`/admin`)

Panel para vos como operador de LinkHub — ver y gestionar **todos** los usuarios y páginas de la plataforma, algo distinto del `/dashboard` de cada usuario (que solo ve lo suyo). Antes no existía; se construyó en esta sesión.

### 17.1 — Cómo acceder

1. En Vercel → Settings → Environment Variables, agregar:
   ```
   ADMIN_EMAILS=tu-email@ejemplo.com
   ```
   Podés poner más de un email separado por coma (`admin1@x.com,admin2@x.com`) si más adelante alguien más del equipo necesita entrar. **Sin esta variable, `/admin` no es accesible para nadie** — es la única llave, no hay ningún otro usuario con acceso por defecto.
2. Redeploy (o esperá al próximo deploy) para que la env var tome efecto.
3. Iniciá sesión normal en LinkHub con ese email (el mismo login de siempre, magic link). Si tu email está en `ADMIN_EMAILS`, te va a aparecer un ítem **"Admin"** en el menú lateral de `/dashboard`. También podés ir directo a `linkhub-pi.vercel.app/admin`.
4. Cualquier otro usuario logueado que intente entrar a `/admin` recibe un 404 liso, sin pistas de que la sección existe.

### 17.2 — Qué se puede hacer ahí

| Sección | Qué muestra | Qué se puede gestionar |
|---|---|---|
| **Resumen** (`/admin`) | Usuarios totales, altas de la semana, cuántos en Pro vs Free, MRR estimado, páginas totales/publicadas, vistas acumuladas, últimas altas | Solo lectura |
| **Usuarios** (`/admin/users`) | Todos los usuarios: nombre/email, plan, cantidad de páginas, fecha de alta. Buscador por email/nombre | Cambiar el plan de cualquier usuario (Free ↔ Pro) con un selector — reemplaza la query SQL manual de § 9, aplica al toque, sin pasar por Stripe |
| **Páginas** (`/admin/pages`) | Todas las páginas de todos los usuarios: nombre, dueño, vistas, fecha, estado | Publicar/despublicar cualquier página — moderación básica (ej. bajar algo reportado) sin depender del dueño ni entrar a Supabase |

### 17.3 — Cómo está protegido (por si lo tocás)

- `ADMIN_EMAILS` es una lista en una variable de entorno, no una columna en la base — a propósito: una columna `is_admin` necesitaría la misma defensa contra auto-escalación que ya tiene `plan` (migración 005), mientras que una env var no la toca ningún usuario ni por accidente.
- El acceso se revisa en el servidor en cada request (`src/lib/admin.ts` + `src/app/admin/layout.tsx`), no solo se oculta un link en el menú.
- Las dos acciones de gestión (`/api/admin/set-plan`, `/api/admin/toggle-page`) vuelven a chequear que quien llama es admin, server-side, cada vez — nunca confían en que si alguien "llegó hasta ahí" ya está autorizado.
- Ambas rutas escriben con el cliente de service role (`src/lib/supabase/admin.ts`), porque actúan sobre filas que no son del usuario logueado — RLS no lo permitiría con el cliente normal.
