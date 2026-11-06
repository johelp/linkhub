# Añadir una pasarela de pago

Hoy hay tres: `mercadopago`, `stripe` (Connect) y `redsys`. El tipo es `PaymentProvider` en `src/types/index.ts`. Cada vendedor conecta **su propia cuenta**; el dinero va a él. Referencia: mira cómo está hecha `redsys` (credenciales) y `stripe` (OAuth).

## Principios que no se negocian

- **Precio y producto solo desde la página guardada**: `resolvePayable()` (`src/lib/payments/payable.ts`) lee los bloques publicados; la URL solo lleva ids.
- **Páginas pausadas por impago o no publicadas no cobran** (ya lo hace `resolvePayable`; no lo saltes).
- Los **secretos** del vendedor se cifran con `encryptSecret()` (`src/lib/crypto.ts`) antes de guardarse y solo se leen con service role. Nunca van al navegador, a logs, a la API REST ni al MCP (`list_payments` selecciona columnas explícitas).
- Toda notificación del proveedor se **verifica** (firma) y se cruza con el pedido (importe, comercio) antes de aprobar; se registra cada paso con `logPaymentEvent()`; las entregas duplicadas no deben duplicar efectos (ver `processed_webhook_events` en Stripe).

## Checklist

1. **Tipo y metadatos** — añade el id a `PaymentProvider` (`src/types/index.ts`), a `PROVIDER_IDS` (`src/lib/payments/history.ts`) y una entrada en `PROVIDERS` (`src/lib/payments/meta.ts`): nombre, región, monedas (`currencies`) y `setup: 'oauth' | 'credentials'`. `chooseProvider()` decide el orden por moneda: ajústalo si procede.
2. **Disponibilidad de la plataforma** — `serverReadiness()` en `src/lib/payments.ts` (qué variables de entorno hacen falta) y `ProviderStatus`/`getPaymentsStatus()` si el tipo de conexión es nuevo.
3. **Base de datos** — nueva migración que amplíe el `check` de `payment_connections.provider` (ver `014_multi_provider_payments.sql`; `payments.provider` es texto libre con `'mercadopago'` por defecto). Guarda lo específico en `payment_connections.config` (JSON, sin secretos).
4. **Conexión del vendedor** — `src/app/api/connect/{proveedor}/…` (inicio + callback OAuth, o formulario de credenciales con validación de forma como `validateCredentialsShape` en Redsys). Cifra tokens al guardar. La desconexión usa `/api/connect/disconnect`.
5. **Cobro** — `src/app/api/pay/{proveedor}/route.ts`: llama a `resolvePayable()`, valida importe/moneda (`validMoney`, `toMinorUnits` en `payments/money.ts`), crea la fila en `payments` (estado `pending`) y redirige al proveedor. `/api/pay` ya hace el despacho `redirect → /api/pay/${provider}`.
6. **Webhook** — `src/app/api/webhooks/{proveedor}/route.ts`: leer el cuerpo **crudo**, verificar firma, localizar el pago, comprobar importe y comercio, y llamar a `approvePayment()` / `markPayment()` (`payments/fulfil.ts`, que emite entradas y correos). Registra eventos con `logPaymentEvent()`. Responde 2xx solo cuando el procesamiento es seguro de no repetir.
7. **Interfaz** — `src/app/dashboard/payments/` (asistente `PaymentsWizard`, historial) y `GatewayField` del `PropertiesPanel` leen `PROVIDERS`. Esa carpeta puede estar en edición por otra persona: coordina antes de tocarla.
8. **Flag** (recomendado) — flag nuevo en `FLAGS` y entrada en `PROVIDER_FLAG` (`src/lib/flags.ts`) para ofrecerla primero a clientes piloto. Hoy `PROVIDER_FLAG` se aplica en la interfaz, no en las rutas de conexión: si quieres bloqueo duro, compruébalo también en `/api/connect/{proveedor}`.
9. **CSP / cabeceras** — si el proveedor usa un formulario o redirección a un dominio nuevo, añádelo a `form-action` en `next.config.ts` (como `checkout.stripe.com` o `sis.redsys.es`).
10. **Entorno y docs** — variables nuevas en `.env.local.example`, `SETUP.md` y la tabla de [migraciones-y-entornos.md](./migraciones-y-entornos.md) (y en la lista de `src/app/admin/system/page.tsx`); `docs/CHANGELOG.md`.
11. **Pruebas** — funciones puras (firma, importes, mapeo de estados) con test en `tests/` (ver `tests/payments.test.ts`). Prueba de extremo a extremo en sandbox del proveedor, con staging y sus claves de prueba.

## MCP y API

`list_payments` devuelve cualquier `provider` guardado, pero su filtro `provider` es un `enum` en `src/lib/mcp/privateTools.ts`: **añade ahí el nuevo id** (y en `docs/developers/mcp.md`).
