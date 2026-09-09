# LinkHub — Cuentas y puesta en marcha

Checklist de todo lo que hace falta para tener el proyecto corriendo en producción, y cómo cargarlo.

## 1. Cuentas necesarias

| Servicio | Para qué | Plan mínimo | Obligatorio |
|---|---|---|---|
| [Supabase](https://supabase.com) | DB Postgres + Auth (magic link) + Storage | Free (o Pro cuando haya tráfico real) | Sí |
| Hosting: [Vercel](https://vercel.com) o [Railway](https://railway.app) | Deploy de la app Next.js | Ya tenés Railway pago | Sí (uno de los dos) |
| Dominio propio (ej. `linkhub.app`) | URL final del producto | — | Recomendado antes de lanzar |
| [Stripe](https://stripe.com) | Cobro de planes Pro/Agency | — | Solo cuando actives pagos (Fase 2) |

No hace falta cuenta de email transaccional aparte: Supabase Auth manda el magic link con su propio servicio (límite bajo en el plan Free — si mandás muchos emails de login, conviene configurar un SMTP propio en Supabase → Authentication → Email Templates → SMTP Settings).

## 2. Variables de entorno

Copiá `.env.local.example` a `.env.local` y completá:

```
NEXT_PUBLIC_SUPABASE_URL=          # Supabase → Project Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase → Project Settings → API (anon/public)
SUPABASE_SERVICE_ROLE_KEY=         # Supabase → Project Settings → API (service_role — SECRETO, nunca al cliente)

NEXT_PUBLIC_APP_URL=               # URL pública final (https://tu-dominio.com)
NEXT_PUBLIC_APP_NAME=LinkHub

# Cuando actives Stripe:
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

⚠️ **Importante:** `SUPABASE_SERVICE_ROLE_KEY` bypasea todos los permisos (RLS) de la base. Nunca lo expongas al cliente ni lo commitees. El proyecto actual no lo usa en ningún lado del código (`grep -r SUPABASE_SERVICE_ROLE_KEY src/` no da resultados) — está en el `.env.local.example` por si en el futuro se necesita para tareas admin (ej. un endpoint de backoffice para dar planes gratis a mano).

## 3. Base de datos (Supabase)

En el SQL Editor de Supabase, correr en orden:

1. `supabase/migrations/001_initial_schema.sql` — esquema completo (profiles, pages, analytics_events, custom_domains, RLS).
2. `supabase/migrations/002_plan_enforcement_and_views.sql` — agregado en esta sesión: corrige el contador de vistas (nunca se incrementaba) y agrega el enforcement de límites de plan a nivel de base de datos (no se podía bypasear el gating de bloques Pro llamando la API de Supabase directo).

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

## 6. Antes de cobrar (Stripe — Fase 2)

Todavía no hay integración de Stripe en el código (solo las env vars comentadas). Cuando quieras activarlo, hace falta:
- Checkout Session (o Payment Links) para Pro (€19) y Agency (€49)
- Webhook (`/api/webhooks/stripe`) que actualice `profiles.plan` y `profiles.plan_expires_at` cuando el pago se confirma/cancela/vence
- Manejo de downgrade cuando vence la suscripción (¿qué pasa con páginas/bloques que superan el límite del plan Free? hoy el trigger de la migración 002 lo bloquearía en la próxima edición, pero no borra contenido existente — hay que decidir la política)

## 7. Dar plan Pro/Agency gratis a los primeros clientes (manual)

Mientras no haya Stripe, para regalar plan Pro o Agency a un cliente puntual: Supabase → SQL Editor →

```sql
-- Por email (más práctico que buscar el UUID a mano)
update public.profiles
set plan = 'pro',                              -- o 'agency'
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

## 8. Nota documentada: creadores de contenido (OnlyFans y similares) como público objetivo

Quedó planteado como posible público a futuro, sin construir nada todavía por decisión explícita (foco actual: dejar la base funcional). Cuando se retome, la conversación tuvo estas ideas sobre la mesa — quedan documentadas para no perderlas:

- **Gate de +18 / contenido sensible**: splash de verificación de edad antes de mostrar la página pública, con un flag `sensitive` a nivel página.
- **Bloque "suscripción paga"**: un tipo de bloque nuevo, tipo botón premium con preview bloqueada/blur, pensado para enlazar a OnlyFans/Fansly/Fanvue u otras plataformas de suscripción.
- **Blur por bloque**: toggle "contenido sensible" en cualquier bloque existente, que lo muestra difuminado hasta que el visitante confirma ser mayor de edad.

Cosas a resolver *antes* de construir esto (no son solo feature work):
- Términos de servicio / política de contenido: LinkHub pasaría a alojar links hacia contenido para adultos, lo cual tiene implicancias legales y de moderación que hoy el proyecto no contempla (no hay ToS ni política de uso aceptable en el repo).
- Revisar los Términos de Servicio de Vercel/Railway y de la pasarela de pago que se use — varios prohíben o restringen explícitamente alojar/facturar contenido para adultos.
- Puede requerir un plan/tier de precio distinto y verificación de identidad del creador (KYC), no solo del visitante.
