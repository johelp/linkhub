# Entornos, despliegue y lanzamiento gradual

> Actualiza este documento cuando cambie un entorno, una variable o el flujo de despliegue.

## 1. Entornos
| | Desarrollo | **Staging** (pruebas) | **Producción** |
|---|---|---|---|
| Rama | ramas de trabajo | `staging` | `main` |
| URL | `localhost:3000` / vista previa de Vercel | `staging.tudominio.com` | `tudominio.com` |
| Supabase | proyecto de staging | **proyecto separado** de staging | proyecto de producción |
| Stripe / Mercado Pago / Redsys | modo prueba | **modo prueba** (sandbox) | modo real |
| `NEXT_PUBLIC_APP_ENV` | `development` | `staging` | `production` |
| Emails | no se envían | solo a `EMAIL_SANDBOX_ALLOW` | reales |
| Buscadores | bloqueados | bloqueados (`noindex`, robots) | permitidos |

El código se comporta distinto según `NEXT_PUBLIC_APP_ENV`: en staging aparece una barra "Entorno de PRUEBAS", Redsys solo acepta su entorno de pruebas, los emails se filtran y todo queda fuera de Google.

## 2. Puesta en marcha (una sola vez)
1. **Supabase:** crea un segundo proyecto "linkhub-staging". Aplica en él todas las migraciones de `supabase/migrations/` en orden (001 → 020).
2. **Vercel:** en el proyecto, *Settings → Git*: *Production Branch* = `main`. Añade el dominio `staging.…` y asígnalo a la rama `staging`. En *Environment Variables* carga cada variable **por entorno** (Production / Preview=staging), con claves distintas.
3. **GitHub:** crea *Environments* `staging` y `production` (en `production`, marca *Required reviewers* = tú). Guarda los secretos `SUPABASE_DB_URL` en cada uno. Protege `main` (PR obligatorio + checks de CI).
4. **Stripe/Mercado Pago/Redsys:** en staging usa claves de prueba; registra los webhooks de staging y de producción por separado.

## 3. Variables de entorno (resumen)
Ver `.env.local.example` y `/admin/system` (lista de las que faltan). Imprescindibles: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_ENV`, `ADMIN_EMAILS`, claves de Stripe. Recomendadas: `TOKEN_ENCRYPTION_KEY`, `RESEND_API_KEY`. Opcionales por pasarela: `MERCADOPAGO_*`, `STRIPE_CONNECT_*`.
Nunca copies claves de producción a staging.

## 4. Flujo de trabajo
```
rama de trabajo ──PR──▶ vista previa de Vercel ──merge──▶ staging ──probar──▶ main (producción)
```
1. Trabajas en una rama; el PR genera una **vista previa** y corre el CI (tipos, lint, tests, auditoría, build, detección de secretos).
2. Al fusionar en `staging`, se despliega en el entorno de pruebas y **se aplican las migraciones** al Supabase de staging (workflow `migrate.yml`).
3. Pruebas en staging (con el panel `/admin/system` en verde).
4. Se fusiona `staging` → `main`: se despliega a producción y las migraciones esperan **tu aprobación** (Environment `production`).

## 5. Lanzamiento escalonado de funciones (flags)
Las funciones nuevas se publican **apagadas** y se activan desde `/admin/features`:
1. **Código en producción, función apagada.** Nadie la ve (los administradores sí: pruébala en producción).
2. **Piloto:** actívala para 1–5 clientes concretos (email). Pídeles feedback; revisa `/admin/payments` y `/admin/audit`.
3. **Porcentaje:** 10 % → 25 % → 50 %. Siempre los mismos clientes; subir el porcentaje solo suma.
4. **Todos:** "Activada para todos". Cuando esté estable, elimina el flag del código (limpieza).
5. **Marcha atrás:** apaga el flag. Las páginas que ya usaban la función siguen funcionando (no se rompe nada); solo se impide añadirla de nuevo.

Flags actuales (`src/lib/flags.ts`): `order_menu_block`, `appointment_block`, `stripe_connect`, `redsys`.
Añadir un flag: declararlo en `FLAGS`, usarlo con `getFlagsForUser()` en servidor y reflejarlo aquí.

## 6. Migraciones (orden y reglas)
Aplica siempre en orden numérico. Todas son idempotentes. Principio **expandir → migrar → contraer**: primero añade columnas/tablas (compatible con el código viejo), despliega el código, y solo después elimina lo antiguo.
`011` endurecimiento · `012` estadísticas · `013` idempotencia/auditoría/moderación/límites · `014` multi-pasarela · `015` eventos de pago · `016` flags · `017` impago · `018` claves API (si existe) · `019` base de conocimiento · `020` votos de Próximamente.
Si venías aplicando a mano, marca las ya aplicadas con `supabase migration repair --status applied <versión>` antes de activar el workflow.

## 7. Salud, copias y marcha atrás
- **Salud:** `/api/health` (uptime) y `/admin/system`.
- **Copias:** activa PITR/backups diarios en Supabase (plan de pago) y prueba una restauración **en un proyecto nuevo** cada trimestre. Anota fecha y duración en `security/07-evidencia/`.
- **Revertir un despliegue:** en Vercel, *Deployments → Promote to Production* de la versión anterior (instantáneo). Las migraciones no se revierten: por eso se escriben compatibles hacia atrás.
- **Incidente:** ver `security/06-runbooks.md`.

## 8. Lista de comprobación antes de producción
- [ ] Claves de Supabase **rotadas** (las antiguas estuvieron en el historial de Git).
- [ ] `ADMIN_EMAILS`, `TOKEN_ENCRYPTION_KEY`, `NEXT_PUBLIC_APP_ENV=production` definidos.
- [ ] Migraciones 011–020 aplicadas (`/admin/system` en verde).
- [ ] Webhooks de Stripe (plataforma y Connect), Mercado Pago configurados con la URL de producción.
- [ ] Precios por moneda creados en Stripe y sus IDs cargados.
- [ ] Dominio, HTTPS y `NEXT_PUBLIC_APP_URL` correctos; `/robots.txt` y `/sitemap.xml` correctos.
- [ ] Backups activos y una restauración de prueba hecha.
- [ ] Protección de `main` y 2FA en GitHub, Vercel, Supabase, Stripe y correo.
- [ ] Textos legales (privacidad, términos, cookies) publicados — **pendiente**.
