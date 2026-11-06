# Changelog

Formato: más reciente primero. Cada cambio en rutas, migraciones, variables, bloques, flags, herramientas MCP o pasarelas debe añadir aquí una entrada (ver «Política de documentación» en `AGENTS.md`).

## 2026-11-06 — Servidor MCP, API keys y documentación para desarrolladores

**Añadido**
- Servidor MCP en `POST /api/mcp` (Streamable HTTP sin estado, JSON-RPC 2.0). Nivel público (sin clave, solo lectura): `get_business`, `list_offers`, `search_knowledge`, `get_availability`, `create_booking_link`, `create_order_link`, `get_contact`, más recursos `linkhub://page/{slug}` y `…/facts`. Nivel cliente (clave `lh_…`): `list_my_pages`, `get_my_page`, `update_page_settings`, `update_block`, `list_knowledge`, `upsert_knowledge`, `delete_knowledge`, `get_analytics_summary`, `list_payments`. Ver `docs/developers/mcp.md`.
- API keys con scopes `pages:read`, `pages:write`, `knowledge:read`, `knowledge:write`, `analytics:read`, `payments:read`. **Migración 018** (`api_keys`, `api_key_audit`). Ruta `/api/developer/keys` y pantalla `/dashboard/developers` («Desarrolladores»; en móvil se enlaza desde Ajustes).
- API REST de lectura `GET /api/v1/pages` y `GET /api/v1/pages/{slug}`; contrato en `public/openapi.json`.
- Flag `developer_api` (apagado por defecto) que gobierna la creación de claves y todo uso autenticado.
- `src/lib/pageWrite.ts`: validación, límites de plan, flags y saneado de escritura de páginas, compartido por `PATCH /api/pages` y el MCP (sin cambios de comportamiento en la ruta).
- Documentación en `docs/developers/`, `scripts/check-docs.mjs` y paso consultivo en CI; «Política de documentación» en `AGENTS.md`.

**Notas de despliegue**
- Aplicar la migración 018 antes de activar el flag `developer_api` para ningún cliente.
- Límites de uso en memoria por instancia (ver `docs/developers/mcp.md#límites`). Sin variables de entorno nuevas.
