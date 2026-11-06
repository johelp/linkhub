# Añadir un tipo de bloque

Una página es una lista de bloques JSON (`pages.blocks`). Un bloque nuevo **no necesita migración** de tablas; solo código y, si procede, un flag. Ejemplo mental: `map_embed` o `vcard` (ver cómo están hechos).

## Checklist

1. **Tipos** — `src/types/index.ts`
   - Añade el literal a `BlockType`.
   - Define `interface MiBloque extends BlockBase { type: 'mi_bloque'; data: {...} }`. Los textos visibles van en `translations: Record<Lang, {...}>`.
   - Añádelo a la unión `Block`.
   - Plan: todo lo que **no** esté en `FREE_BLOCKS` (`link`, `section_label`, `divider`) exige Pro (`blockRequiresPro`). Si lo quieres gratis, añádelo a `FREE_BLOCKS` **y** al array `free_blocks` de la función SQL `enforce_plan_limits` (última versión en `supabase/migrations/011_security_hardening.sql`; otra migración nueva que la reemplace). Si es Pro no hay que tocar SQL: el *trigger* solo lista los gratuitos.
2. **Catálogo** — `src/lib/blocks/registry.ts`: nueva entrada en `BLOCK_REGISTRY` (`type`, `label`, `description`, `icon`, `category`, `createDefault()` con `generateId()`, `visible: true`, `seasonFilter: 'always'`). Si cambias la forma de `data` de un tipo existente, haz compatible lo ya guardado en `normalizeBlock()`.
3. **Editor** — `src/app/editor/[pageId]/PropertiesPanel.tsx`: un `case 'mi_bloque'` con su editor de propiedades. `summary.ts` (`src/lib/blocks/summary.ts`) aporta el título/detalle que se ve en la lista de bloques.
4. **Página pública** — `src/app/p/[slug]/PageView.tsx`: `case 'mi_bloque'` en el render. Muestra un `EmptyBlockPlaceholder` en el editor cuando falte configuración y `null` en público.
5. **Seguridad** — todo `data` pasa por `sanitizeBlocks()` (`src/lib/security.ts`): cualquier clave cuyo nombre termine en `url`/`href` se vacía si su esquema no es `http(s)`, `mailto`, `tel` o ruta relativa. Usa esos nombres de clave para enlaces. Si el bloque se inyecta en un `<script>`, `<iframe>` o CSS, valida el formato exacto al renderizar (ver `GA4_ID_RE` en `p/[slug]/page.tsx` o `mapEmbedUrl`). Nunca uses `dangerouslySetInnerHTML` con datos del bloque.
6. **SEO / asistentes** — si aporta hechos del negocio (horarios, ofertas, contacto), extráelos en `extractFacts()` (`src/lib/seo.ts`) y añade un test: así llegan a JSON-LD, `llms.txt`, `facts.json` y al MCP (`get_business`, `list_offers`).
7. **Plantillas y ejemplos** (opcional) — `src/lib/blocks/templates.ts` y las demos.
8. **Despliegue gradual** (opcional, recomendado para bloques con riesgo)
   - Añade el flag en `FLAGS` (`src/lib/flags.ts`, nace apagado) y la relación en `BLOCK_FLAG` (`tipo → flag`).
   - `hiddenBlockTypes()` oculta el bloque en el selector del editor, y `checkFlagBlocks()` (`src/lib/pageWrite.ts`) impide **añadirlo** por API o MCP; los ya presentes siguen editables.
   - Activación por cliente en `/admin/features`.
9. **Escritura vía MCP** — no hay que hacer nada: `update_block` pasa por `evaluatePageWrite()` con las mismas reglas. Revisa si el bloque necesita algo en la tabla de [mcp.md](./mcp.md).
10. **Pruebas y docs** — test de la lógica pura (relativos con `.ts`), y actualiza esta documentación, `README.md` (tabla de planes si cambia) y `docs/CHANGELOG.md`.

## Comprobación final

```bash
npm run typecheck && npx eslint && npm test
```
Crea la página en el editor, publícala y verifica la vista pública (hasta ~60 s por ISR), `/p/{slug}/facts.json` y el comportamiento con una cuenta Free.
