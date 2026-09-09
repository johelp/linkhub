# LinkHub — Roadmap

Todo lo que se fue planteando en conversación, para no perderlo. Nada de esto está construido salvo que diga "✅ hecho".

## ✅ Hecho

- Bloques: link, featured, expandable, section_label, social_grid, contact_card, text, divider, image_banner, video_embed, email_capture
- Preview instantáneo sin registro en el home (`LivePreview.tsx`)
- Captura de email + export CSV por página (`/api/subscribers/export`, botón ✉️ en cada card del dashboard)
- Stripe: checkout, portal de facturación, webhook (ver `SETUP.md` §6)
- 2 planes (Free / Pro)

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

## 🔲 Productos digitales, entradas a eventos, Mercado Pago

El más grande de la lista. Spec tal como quedó planteada:
- Vender PDFs/productos digitales y entradas a eventos desde un bloque
- Entradas: 2-3 tipos de precio distintos por evento
- Al comprar una entrada: email automático con el ticket numerado + QR de validación
- El usuario carga **sus propias** credenciales de Stripe o Mercado Pago — LinkHub no es el que cobra, es intermediario
- **Mercado Pago es prioritario** (mercado LatAm)

Piezas que hacen falta (ninguna existe hoy):
1. Guardar credenciales de terceros de forma segura. Mejor **OAuth/Connect** (Stripe Connect, Mercado Pago OAuth/Marketplace) que pedirle al usuario que pegue una API key cruda en un formulario — así LinkHub nunca tiene el secret en texto plano, solo un access token, y el usuario puede revocar el acceso desde su propia cuenta de Stripe/MP.
2. Servicio de email transaccional — hoy no hay ninguno (Supabase Auth solo manda magic links de login). Candidatos simples de integrar con Next.js: Resend, Postmark.
3. Reusar `qrcode` (ya está en el proyecto, usado para el QR de la página) para generar el QR del ticket.
4. Endpoint + pantalla simple de "escanear y validar" para la puerta del evento (marca el ticket como usado, rechaza duplicados).
5. Tablas nuevas: `products` (o `tickets_config`) por página, `orders`/`tickets` con estado (pagado/usado), y las credenciales OAuth del usuario por proveedor.

Es un proyecto en sí mismo, no un agregado — recomiendo dedicarle una sesión aparte, arrancando por Mercado Pago solo (sin ticketing) para validar el flujo de pago antes de sumarle la complejidad de tickets numerados + email + QR de validación.

## 🔲 Creadores de contenido +18 (documentado, no recomendado por ahora)

Ver `SETUP.md` §8 — no promocionar todavía: ya hay un incumbente gratis (AllMyLinks) y un jugador grande que lo permite explícitamente (Beacons), y el riesgo de que Stripe cierre la cuenta de pagos de todo LinkHub si se asocia con contenido para adultos es real. Si se retoma, iría en una marca/entidad separada.

## 🔲 Otras ideas sueltas de la comparación con la competencia

- Verificación de dominio propio con UI (la tabla `custom_domains` existe en la base pero no hay pantalla)
- Mensaje "sin comisión sobre tus ventas" en el pricing una vez que haya ventas de productos — es diferencial real vs. Linktree (12%) y Beacons (9%)
