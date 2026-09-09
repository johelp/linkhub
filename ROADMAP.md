# LinkHub — Roadmap

Todo lo que se fue planteando en conversación, para no perderlo. Nada de esto está construido salvo que diga "✅ hecho".

## ✅ Hecho

- Bloques: link, featured, expandable, section_label, social_grid, contact_card, text, divider, image_banner, video_embed, email_capture
- Preview instantáneo sin registro en el home (`LivePreview.tsx`)
- Captura de email + export CSV por página (`/api/subscribers/export`, botón ✉️ en cada card del dashboard)
- Stripe: checkout, portal de facturación, webhook (ver `SETUP.md` §6)
- 2 planes (Free / Pro)
- Mercado Pago: conexión OAuth por usuario + bloque "Cobrar" + webhook (ver `SETUP.md` §7) — falta cargar credenciales reales y probar en sandbox

## 🔲 Media kit / páginas con plantilla

Hoy un usuario Pro ya puede crear varias páginas y armar lo que quiera con los bloques existentes — un "media kit" (foto, bio, stats, contacto, redes) es 100% armable hoy a mano. Lo que falta es que sea **fácil**: un botón "Nueva página desde plantilla" en el dashboard que arranque con bloques pre-cargados (media kit, ficha de contacto, catálogo de precios) en vez de una página vacía. Es chico — reutiliza `demoPage.ts` como patrón. Buen candidato para una próxima vuelta corta.

## 🔲 Integración con n8n

No hace falta build específico para lo básico: n8n tiene un nodo nativo de Supabase y un nodo HTTP genérico, así que **hoy ya es posible** conectar n8n a la tabla `email_subscribers` (o `pages`, `analytics_events`) dándole a n8n una connection string o el `service_role` key en un credential de n8n — mismo mecanismo que cualquier integración Supabase→n8n.

Lo que sí falta si querés algo más "push" (que LinkHub avise a n8n apenas pasa algo, en vez de que n8n vaya a buscar):
- Un webhook saliente configurable por el usuario (ej. "cuando alguien se suscribe, POST a esta URL") — dispararía desde el mismo lugar donde hoy se hace el insert en `email_subscribers`.
- Requiere UI para que el usuario cargue su URL de webhook de n8n, y idealmente firma HMAC del payload para que n8n pueda verificar que viene de LinkHub.

## 🔲 Sección wiki / instructivos

Centro de ayuda mostrando qué se puede hacer con cada bloque, casos de uso, cómo armar filtros de temporada, etc. Es más trabajo de contenido/redacción que de código — antes de escribir nada conviene decidir: ¿Markdown estático dentro del repo (`/ayuda/[slug]`), o algo editable sin deploy (ej. Notion embebido, o una tabla en Supabase)? Te recomiendo empezar con Markdown estático simple; migrar a algo dinámico si crece.

## 🔲 Recorrido guiado (onboarding tour)

Tour interactivo la primera vez que alguien entra al editor (ej. resaltar "acá agregás bloques", "acá lo publicás"). Técnicamente: o una librería chica tipo `driver.js`/`react-joyride`, o algo casero con un estado `hasSeenTour` en `localStorage`. Recomiendo la librería — reinventar tooltips posicionados correctamente en todos los tamaños de pantalla no vale la pena.

## 🔲 Entradas a eventos (ticketing) sobre Mercado Pago

Mercado Pago Connect + el bloque "Cobrar" genérico ya están (ver ✅ arriba) — esto es la capa de ticketing específica encima, tal como quedó planteada:
- 2-3 tipos de entrada con precios distintos por evento (hoy el bloque "Cobrar" es de un solo precio)
- Al comprar: email automático con el ticket numerado + QR de validación
- Endpoint + pantalla simple de "escanear y validar" en la puerta del evento (marca el ticket como usado, rechaza duplicados)

Piezas que faltan:
1. Servicio de email transaccional — hoy no hay ninguno conectado (Supabase Auth solo manda magic links de login). Ya decidido: **Resend**.
2. Reusar `qrcode` (ya está en el proyecto, usado para el QR de la página) para generar el QR del ticket.
3. Tablas nuevas: `event_tickets` (tipos de entrada + precio por bloque), `ticket_orders` (un ticket numerado por compra, con estado emitido/usado) — se apoyan en `payments` que ya existe.
4. La pantalla de "escanear y validar" necesita pensar quién tiene acceso (¿el dueño de la página solamente, o puede invitar a alguien de staff a escanear sin darle su login completo?).

Sigue siendo su propio desarrollo, pero más chico ahora que Mercado Pago ya está conectado — es "agregarle ticketing a un cobro que ya funciona", no arrancar de cero.

## 🔲 Productos digitales (PDFs, etc.)

Mismo bloque "Cobrar" que ya existe, pero hoy no entrega nada después de pagar — solo queda un registro en `payments`. Falta: subir un archivo (Supabase Storage ya soportado por el proyecto, solo no está usado para esto todavía) y un link de descarga que se habilite después del webhook de pago aprobado (por email, con Resend, o por un link temporal firmado).

## 🔲 Creadores de contenido +18 (documentado, no recomendado por ahora)

Ver `SETUP.md` §9 — no promocionar todavía: ya hay un incumbente gratis (AllMyLinks) y un jugador grande que lo permite explícitamente (Beacons), y el riesgo de que Stripe cierre la cuenta de pagos de todo LinkHub si se asocia con contenido para adultos es real. Si se retoma, iría en una marca/entidad separada.

## 🔲 Tarjeta de fidelidad (suma de sellos) para comercios

Buen fit con el caso de uso "comercios locales" y reusa el QR que ya existe.
- **Versión simple**: link único por cliente + código; el comercio escanea el QR del cliente (o al revés) para sumar un sello. Solo necesita 2 tablas nuevas (`loyalty_cards`, `loyalty_stamps`) y una pantalla de "sumar sello". Buildable en una vuelta.
- **Versión completa** (aparece en Apple Wallet / Google Wallet real): mucho más atractivo pero necesita certificados de Apple Developer + Google Wallet API — proyecto aparte, no un agregado chico.

## 🔲 Otras ideas sueltas de la comparación con la competencia

- Verificación de dominio propio con UI (la tabla `custom_domains` existe en la base pero no hay pantalla)
- Mensaje "sin comisión sobre tus ventas" en el pricing una vez que haya ventas de productos — es diferencial real vs. Linktree (12%) y Beacons (9%)
