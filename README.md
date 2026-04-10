# 🔗 LinkHub — SaaS de páginas de enlaces

Stack: **Next.js 16 · Supabase · Vercel · Tailwind v4 · Zustand · @dnd-kit**

## Planes (por tipo de bloque)

| Bloque / Feature | Free | Pro (€19) | Agency (€49) |
|---|---|---|---|
| Link, Label, Divider | ✅ | ✅ | ✅ |
| Featured, Expandable, Social, Contact, Text, Image | ❌ | ✅ | ✅ |
| Multiidioma | ❌ | ✅ | ✅ |
| Filtros de temporada | ❌ | ✅ | ✅ |
| QR personalizado | básico | ✅ | ✅ |
| Dominio propio | ❌ | ❌ | ✅ |
| Páginas | 1 | ∞ | ∞ |

## Setup local

```bash
git clone https://github.com/johelp/linkhub.git && cd linkhub
npm install
cp .env.local.example .env.local   # completar con Supabase keys
npm run dev
```

**Supabase:** Ejecutar `supabase/migrations/001_initial_schema.sql` en el SQL Editor.
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
