# Documentación para desarrolladores de LinkHub

LinkHub es una app Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage) para crear páginas de enlaces y de negocio, con cobros (Mercado Pago, Stripe, Redsys), citas y pedidos por WhatsApp, capa SEO/GEO para buscadores y asistentes de IA, y ahora un servidor **MCP** y una **API con claves** para integraciones propias.

> Aviso de `AGENTS.md`: esta versión de Next.js tiene cambios incompatibles con lo que probablemente conoces (por ejemplo `src/proxy.ts` en lugar de `middleware.ts`, `params` como `Promise`). Antes de escribir código específico de Next, lee la guía correspondiente en `node_modules/next/dist/docs/`.

## Índice

| Documento | Para qué |
|---|---|
| [arquitectura.md](./arquitectura.md) | Carpetas, modelo de datos, render de páginas públicas, editor, panel, admin, pasarelas, flags, impago, SEO/GEO, base de conocimiento |
| [mcp.md](./mcp.md) | Servidor MCP: endpoint, niveles público y autenticado, todas las herramientas con ejemplos, límites, configuración de clientes |
| [api-keys-y-integraciones.md](./api-keys-y-integraciones.md) | Guía para clientes: crear una clave, API REST, MCP, recetas |
| [agregar-un-bloque.md](./agregar-un-bloque.md) | Checklist para un tipo de bloque nuevo |
| [agregar-una-pasarela-de-pago.md](./agregar-una-pasarela-de-pago.md) | Checklist para un proveedor de cobro nuevo |
| [migraciones-y-entornos.md](./migraciones-y-entornos.md) | Staging/producción, flags, migraciones 011–021 en orden, variables de entorno |
| [seguridad.md](./seguridad.md) | Resumen de controles y enlaces a [`security/`](../../security/) |
| [../CHANGELOG.md](../CHANGELOG.md) | Qué cambió y cuándo |
| `docs/operacion/`, `docs/estrategia/` | Operación y estrategia de producto; existen en la rama principal y se mantienen aparte (referencia, no forman parte de este índice) |

Otros documentos de la raíz: [`README.md`](../../README.md) (visión de producto y planes), [`SETUP.md`](../../SETUP.md) (cuentas y puesta en marcha), [`ROADMAP.md`](../../ROADMAP.md).

## Poner el proyecto en marcha

Requisitos: Node 22 (es la versión de CI) y un proyecto de Supabase (o uno local).

```bash
npm ci
cp .env.local.example .env.local   # completa al menos las 3 variables de Supabase y NEXT_PUBLIC_APP_URL
npm run dev                        # http://localhost:3000
```

Aplica las migraciones de `supabase/migrations/` en orden ([migraciones-y-entornos.md](./migraciones-y-entornos.md)).

## Comprobar, probar, compilar

```bash
npm run typecheck      # tsc --noEmit
npx eslint             # lint
npm test               # node:test con --experimental-strip-types sobre tests/*.test.ts
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=x NEXT_PUBLIC_APP_URL=http://localhost:3000 npm run build
```

Esto es lo que ejecuta `.github/workflows/ci.yml` (además de `npm audit` de producción y gitleaks).

**Reglas para que un archivo sea testeable.** Los tests corren con el *type stripping* de Node, sin bundler. Todo lo que importe un test debe usar imports **relativos con extensión `.ts`** (`./orders.ts`), no el alias `@/`, y no puede usar `enum`, *parameter properties* ni imports de valores que solo sean tipos (usa `import type`). Por eso `src/lib/` separa la lógica pura (`seo.ts`, `appointments.ts`, `orders.ts`, `pageWrite.ts`, `mcp/*`) del acceso a Supabase (`*.server.ts`, `mcp/server.ts`, rutas). Los *helpers* de tests viven en `tests/helpers/` (no se ejecutan solos: el patrón es `tests/*.test.ts`).

## Mantener esta documentación al día

Cualquier cambio en rutas, migraciones, variables de entorno, bloques, flags, herramientas MCP o pasarelas debe actualizar el archivo correspondiente de `docs/developers/` y `docs/CHANGELOG.md` **en el mismo cambio** (política en `AGENTS.md`). `node scripts/check-docs.mjs` avisa si tocaste `supabase/migrations/**` o `src/app/api/**` sin tocar `docs/**`; en CI es un paso informativo que no bloquea.
