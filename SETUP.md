# LinkHub — Cuentas y puesta en marcha

Checklist de todo lo que hace falta para tener el proyecto corriendo en producción, y cómo cargarlo.

## 1. Cuentas necesarias

| Servicio | Para qué | Plan mínimo | Obligatorio |
|---|---|---|---|
| [Supabase](https://supabase.com) | DB Postgres + Auth (magic link) + Storage | Free (o Pro cuando haya tráfico real) | Sí |
| Hosting: [Vercel](https://vercel.com) o [Railway](https://railway.app) | Deploy de la app Next.js | Ya tenés Railway pago | Sí (uno de los dos) |
| Dominio propio (ej. `linkhub.app`) | URL final del producto | — | Recomendado antes de lanzar |
| [Stripe](https://stripe.com) | Cobro del plan Pro | — | Sí, para activar pagos reales (ver §6) |

No hace falta cuenta de email transaccional aparte: Supabase Auth manda el magic link con su propio servicio (límite bajo en el plan Free — si mandás muchos emails de login, conviene configurar un SMTP propio en Supabase → Authentication → Email Templates → SMTP Settings).

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
