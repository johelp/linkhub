# Servidor MCP de LinkHub

Código: `src/app/api/mcp/route.ts` (HTTP) y `src/lib/mcp/` (lógica pura). Tests: `tests/mcp-*.test.ts`.

## Endpoint

`POST {APP_URL}/api/mcp` — MCP sobre **Streamable HTTP**, sin estado y con respuestas JSON (JSON-RPC 2.0). No hay sesiones ni SSE: `GET` y `DELETE` responden `405` con `Allow: POST, OPTIONS`.

Métodos: `initialize`, `notifications/*` (aceptadas, `202` sin cuerpo), `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/templates/list`, `resources/read`. Versiones de protocolo aceptadas: `2025-06-18`, `2025-03-26`, `2024-11-05` (si el cliente pide otra, se responde `2025-06-18`). Se aceptan lotes (array) de hasta 20 mensajes, ejecutados en orden.

Códigos de error JSON-RPC: `-32700` JSON inválido, `-32600` petición inválida, `-32601` método desconocido, `-32602` herramienta o `uri` inválida, `-32603` error interno, `-32001` herramienta que requiere clave, `-32003` clave sin el permiso (con `data.required_scope`), `-32002` recurso no encontrado, `-32029` límite de peticiones (HTTP 429 con `Retry-After`). Los **errores de ejecución y de argumentos** de una herramienta no son errores JSON-RPC: vuelven como resultado con `isError: true` y un texto en español para que el modelo corrija y reintente.

## Dos niveles

| Nivel | Autenticación | Qué ofrece |
|---|---|---|
| Público | Ninguna | Solo lectura sobre páginas **publicadas, sin `seo.noindex` y no pausadas**. CORS abierto sin credenciales |
| Cliente | `Authorization: Bearer lh_...` | Lo anterior + herramientas sobre **tus propias** páginas según los permisos (scopes) de la clave. Requiere el flag `developer_api`. Sin CORS |

Una cabecera `Authorization` presente pero inválida, revocada o caducada devuelve `401` (nunca degrada a público); sin el flag `developer_api`, `403`. `tools/list` solo muestra las herramientas que el llamador puede usar.

## Herramientas públicas (sin clave)

Todas reciben `slug` (lo que va tras `/p/`; patrón `^[a-z0-9][a-z0-9-]{1,60}[a-z0-9]$`). Si la página no existe, no está publicada, es `noindex` o está pausada, la respuesta es la misma: «Página no encontrada o no disponible para asistentes.»

| Herramienta | Argumentos | Resultado |
|---|---|---|
| `get_business` | `slug`, `lang?` | Ficha: hechos (`extractFacts`), meta, tipo schema.org, JSON-LD, enlaces a `llms.txt`/`facts.json`/vCard, capacidades |
| `list_offers` | `slug`, `lang?` | `bookable_services` (con `id`, duración, precio), `orderable_items` (con `id`, precio, disponibilidad), condiciones de envío/retiro, `all_offers` |
| `search_knowledge` | `slug`, `query` (3–200), `limit?` (1–10) | Entradas **públicas** de conocimiento más relevantes |
| `get_availability` | `slug`, `service_id`, `date?` (YYYY-MM-DD), `lang?` | Huecos del calendario semanal en la zona horaria del negocio (sin `date`: próximos 7 días con huecos). No consulta citas ya reservadas |
| `create_booking_link` | `slug`, `service_id`, `date`, `time`, `name` (≤80), `phone?`, `notes?` (≤500) | `whatsapp_url` + `message` para **solicitar** la cita. Solo acepta huecos que `get_availability` ofrece |
| `create_order_link` | `slug`, `items[]` (1–30, `{item_id, qty 1–50}`), `name`, `fulfillment` (`delivery`\|`pickup`), `address?`, `notes?` | `whatsapp_url`, `message`, líneas y totales (precios siempre del servidor) |
| `get_contact` | `slug` | Teléfono, WhatsApp, email, dirección, mapa, horario, perfiles, `vcard_url` |

Las dos herramientas `create_*_link` **no guardan ni envían nada**: la persona abre el enlace y pulsa enviar en WhatsApp (humano en el circuito). Reutilizan `appointments.ts` y `orders.ts`, así que validan igual que la página.

Ejemplo (`tools/call`):

```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_booking_link","arguments":{"slug":"clinica-sol","service_id":"s1","date":"2026-11-09","time":"10:00","name":"Ana"}}}
```
```json
{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"Enlace de solicitud de cita listo.\n{...}"}],
 "structuredContent":{"sent":false,"whatsapp_url":"https://wa.me/34600000000?text=...","message":"*Solicitud de turno · Clínica Sol*\n...","service":{"id":"s1","name":"Masaje","duration_min":60},"date":"2026-11-09","time":"10:00","note":"No se ha enviado ni guardado nada: ..."}}}
```

Error de validación (resultado, no error JSON-RPC):

```json
{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"Argumentos no válidos: arguments.slug: formato inválido"}],"isError":true}}
```

### Recursos

`linkhub://about` (qué es el servidor), plantillas `linkhub://page/{slug}` (Markdown de `buildLlmsText`) y `linkhub://page/{slug}/facts` (JSON con hechos + schema.org). Con una clave `pages:read`, `resources/list` añade tus páginas publicadas (hasta 20).

## Herramientas del cliente (con clave)

| Herramienta | Scope | Hace |
|---|---|---|
| `list_my_pages` | `pages:read` | Lista tus páginas (id, slug, nombre, publicada, visitas, `moderated`) |
| `get_my_page` | `pages:read` | Una página propia (`page_id` o `slug`); `view=summary` (por defecto) o `full` con los datos de cada bloque |
| `update_page_settings` | `pages:write` | Cambia `name` y/o ajustes (idiomas, colores, fuente, SEO, perfil, píxeles). **No** publica, ni cambia slug ni dominio |
| `update_block` | `pages:write` | Cambia `visible` y/o fusiona `data` de un bloque existente (objetos se fusionan, listas se reemplazan enteras). No cambia el tipo ni crea bloques |
| `list_knowledge` | `knowledge:read` | Entradas públicas y privadas de tu cuenta (filtros `page_id`, `kind`, `visibility`) |
| `upsert_knowledge` | `knowledge:write` | Crea (sin `id`) o reemplaza (con `id`) una entrada: `title` ≤200, `content` ≤4000, `kind` faq/info/policy, `visibility` public/private |
| `delete_knowledge` | `knowledge:write` | Borra una entrada propia (destructiva) |
| `get_analytics_summary` | `analytics:read` | Vistas y clics por página (recuentos exactos) en 1–90 días + bloques más pulsados (muestra de los últimos 1000 clics; `approximateTopBlocks`) |
| `list_payments` | `payments:read` | Cobros (solo lectura): estado, proveedor, importe, concepto, id del proveedor; email del pagador **enmascarado** (`c***@dominio`). Máx. 50 |

Las herramientas públicas también están disponibles para quien lleva clave. Ejemplo de escritura:

```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"update_block","arguments":{"page_id":"<uuid>","block_id":"b-book","data":{"services":[{"id":"s1","translations":{"es":{"name":"Masaje"}},"durationMin":30,"price":35}]}}}}
```

### Garantías de las escrituras

- Pasan por `src/lib/pageWrite.ts`, el mismo módulo que usa `PATCH /api/pages`: forma de bloques (≤100, ids únicos), ≤512 KB, colores hex, plan (un plan Free no puede escribir bloques Pro), flags de despliegue (no se puede **añadir** un bloque con flag apagado) y saneado de URLs (`javascript:`, `data:`…). Además `update_page_settings` exige `enabledLangs ⊇ defaultLang` y plan Pro para más de un idioma, y valida `ga4Id`/`metaPixelId`.
- La identidad sale **solo de la clave**; un argumento `user_id` se rechaza. Una página o entrada ajena es indistinguible de una inexistente.
- Cada escritura se registra en `api_key_audit` **antes** de aplicarse (campos tocados y tamaños, nunca el contenido). Si no se puede registrar, la escritura se rechaza.
- Los cambios en la página pública tardan hasta ~60 s (ISR).

## Contenido no confiable

Todo texto escrito por negocios o terceros (nombres, descripciones, FAQ, cobros) va dentro de `<datos_no_confiables>…</datos_no_confiables>`, con un aviso previo, y `structuredContent.untrusted = true`. Los `<` se escapan (`<`), de modo que el contenido no puede cerrar la etiqueta. No elimina la inyección de instrucciones: los clientes deben tratar la salida de herramientas como datos y pedir confirmación antes de actuar (sobre todo con herramientas de escritura).

## Límites

| Qué | Límite |
|---|---|
| Público | cubo de 30 peticiones, +0,5/s (~30/min) por IP |
| Con clave | cubo de 120, +2/s (~120/min) por clave |
| Claves inválidas | 10 intentos y luego ~3/min por IP; con el cubo vacío incluso la clave buena recibe 429 |
| Cuerpo | 32 KB sin clave, 640 KB con clave; lote ≤20 (cada mensaje cuesta 1 token) |

**Limitación en serverless:** los contadores están en memoria de cada instancia (`src/lib/mcp/rateLimit.ts`). Cada instancia fría empieza de cero y varias instancias suman su propio cubo, así que es un freno contra bucles y abuso casual, no un límite global estricto. Para uno estricto hay que poner un almacén compartido (Redis/Upstash) o el firewall de la plataforma delante. La IP se toma de `x-vercel-forwarded-for`/`x-forwarded-for`/`x-real-ip`: solo es fiable detrás de un proxy que la fije (Vercel lo hace).

## Configurar clientes

Sustituye `https://TU_DOMINIO` por el dominio de tu despliegue. Estas configuraciones no se han probado contra cada cliente en este repositorio; comprueba los nombres de opciones en la versión que uses.

**Claude Code**

```bash
claude mcp add --transport http linkhub https://TU_DOMINIO/api/mcp
# con clave (herramientas de gestión):
claude mcp add --transport http linkhub https://TU_DOMINIO/api/mcp --header "Authorization: Bearer lh_..."
```

**Claude Desktop** (`claude_desktop_config.json`, mediante el puente `mcp-remote`):

```json
{
  "mcpServers": {
    "linkhub": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://TU_DOMINIO/api/mcp", "--header", "Authorization:${LINKHUB_AUTH}"],
      "env": { "LINKHUB_AUTH": "Bearer lh_..." }
    }
  }
}
```
Para el nivel público basta con quitar `--header` y `env`.

**Otros clientes MCP** que admiten HTTP remoto: URL `https://TU_DOMINIO/api/mcp`, transporte «streamable HTTP», cabecera opcional `Authorization: Bearer lh_...`. Prueba rápida:

```bash
curl -s https://TU_DOMINIO/api/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Las claves no deben usarse desde páginas web: la preflight CORS no permite la cabecera `Authorization`.

## Seguridad y modelo de amenazas

Ver [seguridad.md](./seguridad.md#api-keys-y-mcp). Resumen: claves solo en hash, scopes mínimos, aislamiento por dueño verificado con tests, sin peticiones salientes (no hay SSRF), contenido marcado como no confiable, auditoría previa a cada escritura, límites de uso y CORS solo para el nivel público.

## Añadir o cambiar una herramienta

1. Define la herramienta en `src/lib/mcp/publicTools.ts` o `privateTools.ts` (`scope: null` = pública). El `inputSchema` es la fuente única: se publica en `tools/list` y se valida igual (`validate.ts`, propiedades desconocidas rechazadas).
2. Si escribe páginas, usa `evaluatePageWrite()`; si escribe algo, llama a `audited()` antes.
3. Si usa datos de un dueño, el acceso va en `src/lib/mcp/store.ts` con filtro `user_id` explícito (el servicio usa service role: no hay RLS que te proteja) y un test en `tests/mcp-store.test.ts`.
4. Actualiza esta tabla, `public/openapi.json` si afecta a la API REST, y `docs/CHANGELOG.md`.
