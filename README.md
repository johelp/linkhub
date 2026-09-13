# 🔗 LinkHub — SaaS de páginas de enlaces

Stack: **Next.js 16 · Supabase · Stripe · Mercado Pago · Vercel/Railway · Tailwind v4 · Zustand · @dnd-kit**

Guía completa de cuentas, variables de entorno, deploy, Stripe/Mercado Pago y rotación de credenciales: ver [`SETUP.md`](./SETUP.md).
Ideas y features planeadas (no construidas): ver [`ROADMAP.md`](./ROADMAP.md).

## ⚠️ Estado actual (11 sep 2026)

**Producción (`linkhub-pi.vercel.app`) está corriendo el código de [PR #1](https://github.com/johelp/linkhub/pull/1), todavía sin mergear a `main`** — se promovió manualmente porque la versión que había en `main` no andaba. CI del PR en verde (lint, build, preview de Vercel y Supabase), pero falta cerrar esto **antes de anunciar nada al equipo como estable**:

| Pendiente | Estado | Por qué importa |
|---|---|---|
| Rotar credenciales de Supabase (`anon`/`service_role`, filtradas en un commit viejo de `main`) | 🟡 en curso | Las que están filtradas siguen siendo válidas hasta rotarlas |
| Correr migraciones `001`–`009` contra el proyecto real | 🔴 pendiente | La `005` cierra un agujero real: hoy cualquier usuario logueado puede auto-asignarse plan Pro sin pagar, llamando a Supabase directo desde la consola del navegador |
| Auth → URL Configuration (Site URL / redirect) en Supabase | 🔴 pendiente | Sin esto el login con magic link no redirige bien en producción |
| Env vars de Supabase actualizadas en Vercel | 🟡 sin confirmar | Necesario para que las credenciales rotadas tomen efecto |
| Mergear PR #1 a `main` | 🔴 pendiente | Higiene de repo — el código ya está en producción de todos modos |

**Recién agregado** (en PR #1, no mergeado): páginas con plantilla al crear una página nueva (Vacía / Catálogo de precios / Ficha de contacto / Media kit), bloque de Menú/Carta con categorías y precios (no un simple link a PDF), fix de bloques que quedaban invisibles en el editor hasta configurarlos (imagen, video, menú).

**Pendiente de construir** (specs escritas en `ROADMAP.md`, sin código todavía): subida de imágenes optimizadas (hoy solo se puede pegar una URL externa), revisión más amplia del editor (a definir con el equipo qué falta puntualmente), modelo de costos por uso en vez de por bloque.

## Planes (por tipo de bloque)

| Bloque / Feature | Free | Pro (€19/mes) |
|---|---|---|
| Link, Etiqueta de sección, Divisor | ✅ | ✅ |
| Destacado, Desplegable, Redes, Contacto, Texto, Imagen, Video, Captura de email, Cobrar (MP), Entradas a evento, Horario, Reseñas de Google, Tarjeta de sellos, Menú/Carta | ❌ | ✅ |
| Multiidioma | ❌ | ✅ |
| Filtros de temporada | ❌ | ✅ |
| QR personalizado | básico | ✅ |
| Dominio propio | ❌ | ✅ |
| Páginas | 1 | ∞ |

17 bloques en total — catálogo completo visible en la home del sitio.

## Setup local

```bash
git clone https://github.com/johelp/linkhub.git && cd linkhub
npm install
cp .env.local.example .env.local   # completar con Supabase (y Stripe si vas a probar pagos)
npm run dev
```

**Supabase:** correr en orden todo lo que hay en `supabase/migrations/` en el SQL Editor.
**Auth redirect:** `http://localhost:3000/auth/callback`

## Deploy Vercel

1. Push a GitHub
2. Importar en vercel.com → agregar env vars
3. Actualizar Supabase redirect URL al dominio de producción

## Estructura clave

```
src/app/
  page.tsx              → Landing SaaS
  auth/                 → Magic link login
  dashboard/            → Panel usuario
  editor/[pageId]/      → Editor visual 3 columnas
  p/[slug]/             → Página pública (SSG + ISR)
  api/pages/            → PATCH/DELETE
  api/qr/               → Generación QR SVG + PNG
src/hooks/useEditorStore.ts → Zustand (undo/redo, bloques)
src/lib/blocks/registry.ts  → Definición de todos los bloques
src/types/index.ts          → Tipos + PLAN_LIMITS
supabase/migrations/        → Schema SQL completo
```
