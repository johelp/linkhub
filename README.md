# 🔗 LinkHub — SaaS de páginas de enlaces

Stack: **Next.js 16 · Supabase · Stripe · Vercel/Railway · Tailwind v4 · Zustand · @dnd-kit**

Guía completa de cuentas, variables de entorno, deploy y Stripe: ver [`SETUP.md`](./SETUP.md).

## Planes (por tipo de bloque)

| Bloque / Feature | Free | Pro (€19/mes) |
|---|---|---|
| Link, Label, Divider | ✅ | ✅ |
| Featured, Expandable, Social, Contact, Text, Image | ❌ | ✅ |
| Multiidioma | ❌ | ✅ |
| Filtros de temporada | ❌ | ✅ |
| QR personalizado | básico | ✅ |
| Dominio propio | ❌ | ✅ |
| Páginas | 1 | ∞ |

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
