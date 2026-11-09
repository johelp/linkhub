# Inventario

## Activos y superficie
| Componente | Detalle | Datos | Entrada |
|---|---|---|---|
| App Next.js 16 (Vercel) | Landing estática, `/p/[slug]` (ISR), `/dashboard`, `/editor`, `/admin` | — | Web |
| Supabase (Auth, Postgres+RLS, Storage `images`) | Fuente de verdad | emails, páginas, suscriptores, pagos, entradas, tokens MP | PostgREST con clave anon desde el navegador |
| Stripe | Suscripción Pro (checkout/portal alojados) | no se guardan tarjetas | Webhook `/api/webhooks/stripe` (firmado) |
| Mercado Pago | Cobros de los clientes de cada negocio (OAuth + Checkout Pro) | tokens OAuth del vendedor, pagos | `/api/pay/mercadopago` (público), webhook firmado, OAuth callback |
| Resend | Email de entradas | email del comprador | Servidor |
| Endorsely / GA4 / Meta Pixel | Opcionales | identificadores de navegación | Navegador |
| WhatsApp (wa.me) | Pedidos y citas: el navegador abre un chat | nombre, dirección, teléfono del cliente final **no pasan por LinkHub** | Enlace del cliente |

## Clasificación de datos
- **Sensible:** tokens OAuth de Mercado Pago (cifrados con `TOKEN_ENCRYPTION_KEY` si está definida), emails de compradores/suscriptores.
- **Confidencial:** contenido de páginas no publicadas, analíticas, pagos.
- **Público:** páginas publicadas.

## Flujos de datos clave
1. Visitante → `/p/[slug]` → inserta `analytics_events` / `email_subscribers` (anon, RLS + límites en migración 011/013).
2. Dueño → editor → `PATCH /api/pages` (valida, sanea URLs, aplica límites de plan) → Postgres.
3. Cliente final → `/api/pay/mercadopago` → preferencia con token del vendedor (descifrado en servidor) → webhook → ticket + email.
4. Pedidos/citas: se arman en el navegador y salen por WhatsApp; no se almacenan (fase 1).

## Proveedores y regiones — NO VERIFICADO
Región del proyecto Supabase, plan de Vercel y contratos de procesamiento de datos no son visibles desde el repositorio.
