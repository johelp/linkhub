# LinkHub — Roadmap

Todo lo que se fue planteando en conversación, para no perderlo. Nada de esto está construido salvo que diga "✅ hecho".

## ✅ Hecho

- Bloques: link, featured, expandable, section_label, social_grid, contact_card, text, divider, image_banner, video_embed, email_capture, payment_button, event_tickets, business_hours, google_reviews (14 en total, catálogo visible en la home)
- Mensaje predefinido en el link de WhatsApp del bloque de contacto
- Preview instantáneo sin registro en el home (`LivePreview.tsx`)
- Captura de email + export CSV por página (`/api/subscribers/export`, botón ✉️ en cada card del dashboard)
- Stripe: checkout, portal de facturación, webhook (ver `SETUP.md` §6)
- 2 planes (Free / Pro)
- Mercado Pago: conexión OAuth por usuario + bloque "Cobrar" + webhook (ver `SETUP.md` §7) — falta cargar credenciales reales y probar en sandbox
- Entradas a eventos: bloque "Entradas a evento" (2-3 tipos de precio), ticket numerado + QR de validación por email vía Resend, pantalla de validación en `/dashboard/validate/[pageId]` (ver `SETUP.md` §8) — falta cargar `RESEND_API_KEY` y probar de punta a punta con Mercado Pago real
- Google Analytics 4 + Meta Pixel por página (plan Pro): campos en Ajustes → Integraciones, IDs validados antes de inyectar el script en la página pública (ver `SETUP.md` §12)
- Condicionales entre bloques (plan Pro): cualquier bloque puede mostrarse solo "cuando [bloque de horario] esté abierto/cerrado" — aparece como sección "Visibilidad condicional" en el editor del bloque en cuanto hay al menos un bloque de horario de atención en la página. Ej: mostrar "Dejanos tu mensaje" (captura de email) solo si está cerrado
- Comisión de LinkHub por venta vía Mercado Pago Split Payments (`marketplace_fee`): desactivada por defecto, se activa con `MERCADOPAGO_PLATFORM_FEE_PERCENT` (ver `SETUP.md` §7.6). No necesita nada nuevo del lado de la app de Mercado Pago porque ya está creada como "Marketplace/Checkout Pro"
- Tarjeta de fidelidad — versión simple (plan Pro): bloque "Tarjeta de sellos". El visitante toca "Obtener mi tarjeta" en la página pública y le queda un link único guardado en su navegador (`/l/[code]`, con QR); el dueño suma sellos o canjea el premio desde `Dashboard → 🎟️/🏅 (esta página)` escaneando o tipeando ese código. Sin Apple/Google Wallet todavía — queda anotado como posible mejora futura, no es parte de esta versión

## 🔲 Media kit / páginas con plantilla

Hoy un usuario Pro ya puede crear varias páginas y armar lo que quiera con los bloques existentes — un "media kit" (foto, bio, stats, contacto, redes) es 100% armable hoy a mano. Lo que falta es que sea **fácil**: un botón "Nueva página desde plantilla" en el dashboard que arranque con bloques pre-cargados (media kit, ficha de contacto, catálogo de precios) en vez de una página vacía. Es chico — reutiliza `demoPage.ts` como patrón. Buen candidato para una próxima vuelta corta.

## 🔲 Integración con n8n

No hace falta build específico para lo básico: n8n tiene un nodo nativo de Supabase y un nodo HTTP genérico, así que **hoy ya es posible** conectar n8n a la tabla `email_subscribers` (o `pages`, `analytics_events`) dándole a n8n una connection string o el `service_role` key en un credential de n8n — mismo mecanismo que cualquier integración Supabase→n8n.

Lo que sí falta si querés algo más "push" (que LinkHub avise a n8n apenas pasa algo, en vez de que n8n vaya a buscar):
- Un webhook saliente configurable por el usuario (ej. "cuando alguien se suscribe, POST a esta URL") — dispararía desde el mismo lugar donde hoy se hace el insert en `email_subscribers`.
- Requiere UI para que el usuario cargue su URL de webhook de n8n, y idealmente firma HMAC del payload para que n8n pueda verificar que viene de LinkHub.

## 🔲 Sección wiki / instructivos

Centro de ayuda mostrando qué se puede hacer con cada bloque, casos de uso, cómo armar filtros de temporada, etc. Es más trabajo de contenido/redacción que de código — antes de escribir nada conviene decidir: ¿Markdown estático dentro del repo (`/ayuda/[slug]`), o algo editable sin deploy (ej. Notion embebido, o una tabla en Supabase)? Te recomiendo empezar con Markdown estático simple; migrar a algo dinámico si crece.

## 🔲 Repaso UX del editor (bloques, no lo que ya se hizo abajo)

El caso de uso concreto de "condicionales entre bloques" ya está resuelto (ver ✅ Hecho). Queda pendiente, más abierto: repasar el editor completo con foco en que sea fácil de usar a simple vista — nombres de bloque más claros si hace falta, mejor agrupación en el modal "Añadir bloque", quizás una búsqueda si la lista de bloques sigue creciendo. No hay una lista concreta de cambios todavía, solo la intención de revisarlo con ojos frescos.

## 🔲 Recorrido guiado (onboarding tour)

Tour interactivo la primera vez que alguien entra al editor (ej. resaltar "acá agregás bloques", "acá lo publicás"). Técnicamente: o una librería chica tipo `driver.js`/`react-joyride`, o algo casero con un estado `hasSeenTour` en `localStorage`. Recomiendo la librería — reinventar tooltips posicionados correctamente en todos los tamaños de pantalla no vale la pena.

## 🔲 Productos digitales (PDFs, etc.)

Mismo bloque "Cobrar" que ya existe, pero hoy no entrega nada después de pagar — solo queda un registro en `payments`. Falta: subir un archivo (Supabase Storage ya soportado por el proyecto, solo no está usado para esto todavía) y un link de descarga que se habilite después del webhook de pago aprobado (por email, con Resend, o por un link temporal firmado).

## 🔲 Creadores de contenido +18 (documentado, no recomendado por ahora)

Ver `SETUP.md` §10 — no promocionar todavía: ya hay un incumbente gratis (AllMyLinks) y un jugador grande que lo permite explícitamente (Beacons), y el riesgo de que Stripe cierre la cuenta de pagos de todo LinkHub si se asocia con contenido para adultos es real. Si se retoma, iría en una marca/entidad separada.

## 🔲 Tarjeta de fidelidad — Apple Wallet / Google Wallet (v2)

La versión simple ya está construida (ver ✅ Hecho: bloque "Tarjeta de sellos"). Esto es la mejora que queda pendiente a propósito: que la tarjeta aparezca como un pase real en Apple Wallet / Google Wallet en vez de solo un link con QR. Mucho más atractivo pero necesita certificados de Apple Developer + Google Wallet API — proyecto aparte, no un agregado chico, así que se dejó afuera de la v1 a pedido explícito.
- Idea sumada: que las compras de productos digitales (no solo visitas al local) también sumen sellos — encajaría bien una vez que exista la entrega de productos digitales (ver más abajo), reusando la misma tabla `payments` como disparador.

## 🔲 Agenda de citas / reservas (bloque nuevo, plan Pro)

Spec: el dueño define horarios disponibles por día (igual que `business_hours`) y un cliente reserva un turno desde la página pública, sin pasar por WhatsApp/llamada.

Diseño propuesto para una v1 simple (reusando patrones que ya existen en el proyecto):
- **Bloque nuevo** `booking` — similar a `business_hours` pero agrega `slotDurationMinutes` (ej. 30/60) y, a diferencia de horario de atención, sí necesita persistencia (qué turnos ya están ocupados), no solo cálculo en el cliente.
- **2 tablas nuevas**: `booking_slots` config (o se reusa el JSON del bloque, igual que `business_hours`) y `bookings` (page_id, block_id, slot_start timestamptz, client_name, client_contact, status: `confirmed`/`cancelled`). Un índice único en `(block_id, slot_start)` evita el doble booking a nivel de base, no solo de app — mismo criterio que ya se usó para no confiar solo en el chequeo del servidor.
- **Flujo del cliente**: en la página pública, el bloque muestra los próximos N días con horarios libres (calculados restando `bookings` confirmadas al `schedule` del bloque, con la misma lógica de zona horaria IANA que ya tiene `getBusinessOpenStatus`); el cliente elige un turno, pone nombre + contacto, y queda reservado al toque (sin pago, como pide el spec) — igual de simple que el flujo de "captura de email", no el de checkout.
- **Confirmación**: mail al cliente con el turno (reusa Resend, ya integrado) + un link para cancelar (`/r/[code]`, mismo patrón que `/t/[code]` de las entradas).
- **Owner**: pantalla `/dashboard/bookings/[pageId]` con la lista de próximos turnos — mismo patrón que `/dashboard/validate/[pageId]`.
- Gateado a Pro (`limits.advancedBlocks`), como el resto de los bloques no triviales.

Decisiones que quedan pendientes de definir cuando se arranque a construir (cambian el alcance):
1. ¿Un solo servicio/duración por página, o varios servicios con duraciones distintas (ej. "corte" 30 min, "color" 90 min)? V1 de un solo servicio es sensiblemente más simple.
2. ¿La reserva queda confirmada al instante, o el dueño la tiene que aprobar manualmente antes? Instantánea es más simple y es lo que describe el spec tal cual.
3. ¿Reserva gratuita (como está arriba) o con seña/depósito vía Mercado Pago? Si se suma seña, reusa el mismo `createMercadoPagoPreference` que ya existe para entradas.

Recomendación: arrancar con la versión más simple de las tres (1 servicio, confirmación instantánea, sin seña) — es la que describe el spec y es del tamaño de lo que ya se construyó para `event_tickets` o `business_hours`.

## 🔲 Otras ideas sueltas de la comparación con la competencia

- Verificación de dominio propio con UI (la tabla `custom_domains` existe en la base pero no hay pantalla)
- Mensaje "sin comisión sobre tus ventas" en el pricing una vez que haya ventas de productos — es diferencial real vs. Linktree (12%) y Beacons (9%)
