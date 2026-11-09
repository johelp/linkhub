<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Política de documentación

La documentación para desarrolladores vive en `docs/developers/` (índice en `docs/developers/README.md`) y el historial de cambios en `docs/CHANGELOG.md`. Cualquier cambio en **rutas** (`src/app/**/route.ts`, páginas nuevas), **migraciones** (`supabase/migrations/`), **variables de entorno**, **bloques**, **flags** (`src/lib/flags.ts`), **herramientas MCP** (`src/lib/mcp/`) o **pasarelas de pago** debe actualizar el archivo correspondiente de `docs/developers/` y añadir una entrada a `docs/CHANGELOG.md` **en el mismo cambio**. `node scripts/check-docs.mjs` avisa (sin bloquear) cuando una rama toca migraciones o `src/app/api/**` sin tocar `docs/**`.
