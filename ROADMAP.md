# LinkHub — Roadmap

Todo lo que se fue planteando en conversación, para no perderlo. Nada de esto está construido salvo que diga "✅ hecho".

## ✅ Hecho

- Fix real (visto en capturas de la página en vivo del usuario): páginas creadas antes de que `menu_pdf` se renombrara a `menu` (ver commit `560a4ae`→`280ed64`) quedaron con un bloque de tipo `menu_pdf` que ya no existe en el catálogo — se veía como texto crudo "menu_pdf" con ícono genérico en la lista, y sin editor en el panel de propiedades. `normalizeBlock()` en `src/lib/blocks/registry.ts` los upgradea a `menu` (con `pdfUrl` = la URL vieja, `sections: []`) al cargar la página tanto en el editor (`useEditorStore.setPage`) como en el render público (`PageView.tsx`) — sin migración de base de datos: guardar la página en el editor ya persiste el bloque migrado
- Pasada de tipografía y espaciado en todo el editor (capturas reales del usuario mostraban todo muy apretado): tamaños de fuente más grandes en labels/inputs/lista de bloques, más padding en filas e inputs, más separación entre secciones (`space-y-4`→`space-y-5` en cada editor de bloque), modal "Añadir bloque" más ancho con tarjetas más grandes — `PropertiesPanel.tsx`, `BlockListPanel.tsx`, `EditorShell.tsx`
- Subida de imágenes al editor: `ImageBannerEditor` ahora tiene un botón "Elegir imagen" además del campo de URL (no lo reemplaza). Se comprime/redimensiona en el navegador antes de subir (máx. 1600px de lado, calidad ~80%, vía `src/lib/imageUpload.ts`) porque Supabase Storage no optimiza imágenes gratis, y se sube con el cliente browser/anon (nunca el admin) a un bucket nuevo `images` con RLS de carpeta-por-usuario — ver `supabase/migrations/010_storage_images.sql`, **falta que se corra** (ver checklist de migraciones pendientes)
- Fix: en el panel de bloques del editor (`BlockListPanel.tsx`), el handle de arrastrar y los botones de ocultar/duplicar/eliminar solo aparecían con `:hover` — invisibles en cualquier pantalla táctil (tablet, celular), donde no existe hover. Ahora se ven siempre por debajo del breakpoint `md`, y solo se ocultan hasta el hover en desktop
- Dashboard: la fila de acciones de cada página (QR, exportar emails, validar entradas, tarjeta de sellos) eran 4 íconos sueltos sin texto, poco intuitivos — ahora es un menú "···" con etiquetas (`PageCardActions.tsx`). El grid de páginas pasó de `auto-fill` a `auto-fit`, así que con 1-2 páginas las tarjetas existentes se estiran para usar el espacio en vez de quedar chicas con un montón de área vacía al lado
- Bloques: link, featured, expandable, section_label, social_grid, contact_card, text, divider, image_banner, video_embed, email_capture, payment_button, event_tickets, business_hours, google_reviews, loyalty_card, menu (17 en total, catálogo visible en la home)
- Bloque "Menú / Carta" (`menu`, plan Pro): categorías con productos y precio (no un simple link -- un link a PDF por sí solo no aporta nada como "menú" real), con la opción de sumar además un link a un PDF completo. Abre LinkHub a bares y restós sin necesitar generación de imágenes ni ningún servicio pago nuevo — se descartó integrar QR Monster (Stable Diffusion + ControlNet) por requerir una API de inferencia externa con costo por generación, fuera de alcance de esta vuelta
- Bloques que dependen de una URL/archivo (`image_banner`, `video_embed`, `menu`) ahora muestran un placeholder con instrucciones en el editor cuando el campo está vacío, en vez de desaparecer sin feedback -- antes el editor reusaba literalmente el mismo `PageView` que la página pública, que oculta el bloque hasta que esté configurado; ahora `PageView` recibe una prop `editing` que solo el preview del editor pasa
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
- Páginas con plantilla: el botón "Nueva página" del dashboard (`NewPageButton.tsx`) ahora pregunta primero "Vacía / Catálogo de precios / Ficha de contacto / Media kit" (`src/lib/blocks/templates.ts`) y precarga los bloques correspondientes en vez de arrancar siempre en blanco. "Catálogo de precios" usa solo bloques gratuitos (funciona en Free); "Ficha de contacto" y "Media kit" usan bloques Pro (`featured`, `contact_card`, etc.) — a un usuario Free que las elige se lo manda directo a `/dashboard/upgrade` en vez de dejarlo chocar con el trigger de Supabase que las bloquearía igual
- Fix: el botón "Obtener mi tarjeta" (bloque `loyalty_card`) fallaba en silencio cuando el `insert` a `loyalty_cards` daba error (típicamente porque la migración `009_loyalty_cards.sql` todavía no corrió contra ese proyecto de Supabase) — el botón volvía a su estado normal sin ningún mensaje, indistinguible de "no hace nada". Ahora se loguea el error en consola y se muestra un mensaje al visitante (`PageView.tsx`, `LoyaltyCardWidget`). El dashboard `Tarjeta de sellos` (`/dashboard/loyalty/[pageId]`) también distingue ahora "0 tarjetas todavía" de "no se pudo consultar la tabla" con un aviso que apunta a la migración
- Nuevo: `/dashboard/loyalty/[pageId]` lista ahora todos los clientes con tarjeta de esa página (código, sellos, estado, fecha), no solo los contadores agregados — hasta 200 tarjetas, ordenadas por más reciente
- Nuevo: ejemplo "Tarjeta de sellos" (cafetería) sumado al showcase rotativo del hero de la home (`HeroShowcase.tsx` / `demoPage.ts`), mostrando el bloque `loyalty_card` en acción
- Fix: el link de Mercado Pago de "Cobrar" / "Entradas a evento" es un `<a href>` de navegación completa (no `fetch`), así que cualquier error de `/api/pay/mercadopago` (ej. el dueño todavía no conectó Mercado Pago) se veía como un JSON crudo en la pantalla del visitante. Ahora ese endpoint redirige de vuelta a la página pública con `?payment_error=...` y `PageView` lo muestra como un aviso prolijo; los dos casos donde todavía no se conoce la página (parámetros faltantes, página inexistente) devuelven una página HTML mínima en vez de JSON
- Páginas SEO programáticas (`/herramientas/[slug]`, ver `src/lib/qrTools.ts`): 3 generadores de QR gratis y sin registro con utilidad real cada uno (WiFi, Instagram, tarjeta de contacto/vCard) — cada uno genera un formato de QR distinto, no la misma landing repetida con el título cambiado. Todo cliente-side (`qrcode` en el navegador, nada se guarda). Sumado a `sitemap.ts` y como teaser en el home. Índice en `/herramientas`
- Hooks de código para programa de afiliados (Endorsely, elegido sobre Rewardful/Tapfiliate/sistema propio por ser gratis mientras el volumen sea bajo — ver `SETUP.md § 13` la comparación): script gateado por `NEXT_PUBLIC_ENDORSELY_ORG_ID` (sin la env var, cero cambio de comportamiento) en `layout.tsx`; `UpgradeButton.tsx` manda `window.endorsely_referral` a `/api/checkout`. **A medio terminar a propósito**: falta el reporte server-to-server a Endorsely (necesita un API secret que solo existe con la cuenta creada, y su formato exacto no se improvisó por el riesgo de que falle en silencio y no se le pague comisión a nadie) — `TODO(afiliados/Endorsely)` marcado en `/api/checkout/route.ts`. Falta la cuenta de Endorsely + pegar acá el snippet real de su dashboard para terminarlo — ver `SETUP.md § 13`
- Panel de administrador de la plataforma (`/admin`, ver `SETUP.md § 17`): resumen (usuarios, plan Pro vs Free, MRR estimado, páginas, vistas), lista de usuarios con cambio de plan manual (reemplaza la query SQL de § 9), y lista de páginas con publicar/despublicar (moderación básica). Acceso por `ADMIN_EMAILS` (env var, no columna en la base — misma razón por la que `plan` necesitó protegerse en la migración 005: una env var no la puede tocar ningún usuario). Antes no existía nada de esto, había que entrar a Supabase directo
- Email de magic link (login sin contraseña) con la identidad visual de LinkHub en vez del template genérico de Supabase — `supabase/email-templates/magic-link.html`, se pega a mano en el dashboard de Supabase (no es código de la app, Supabase Auth manda ese email directo, no pasa por `src/lib/email.ts`). De paso se detectó y documentó (`SETUP.md § 16`) que el servicio de email incluido de Supabase manda **2 emails por hora en total para todo el proyecto** — no alcanza ni para un puñado de testers logueándose la misma hora, hace falta SMTP propio (con Resend, que ya está dado de alta para las entradas) antes de invitar gente
- Páginas SEO por rubro (`/para/[slug]`, ver `src/lib/verticals.ts`): landing por tipo de comercio (peluquerías y salones, bares y cafeterías, restaurantes, eventos, turismo y temporada), cada una con la demo real de ese rubro (mismo `PageView` que la página pública, no una captura) y highlights atados a bloques reales que existen hoy (carta digital, tarjeta de sellos, entradas, multiidioma+temporada). Corrige el primer intento de esta sesión, que había armado herramientas de QR genéricas en vez de esto — esas quedan igual en `/herramientas`, son un lead magnet aparte, no lo mismo que pidió el usuario. Índice en `/para`, sumado a `sitemap.ts` y a una sección nueva en el home
- Rediseño de jerarquía visual del editor (después de que la pasada anterior de tipografía/espaciado se juzgara insuficiente — "botones sin padding, estilos muy básicos, es un estilo muy básico de IA"): `CATEGORY_META` (color de acento + tinte por categoría de bloque) ahora se usa también en `BlockListPanel.tsx`, no solo en el modal — cada bloque de la lista tiene su ícono en una tira de color en vez de un emoji suelto, mismo lenguaje visual en los dos lugares. `PropertiesPanel.tsx`: el componente `Section` pasó de `div` plano a tarjeta contenida (fondo, borde, radio), con los inputs y filas anidadas recontrastados en blanco para no perderse contra ese fondo nuevo. `EditorTopBar.tsx`: sacada la altura fija que apretaba todo, más padding real en cada botón, hover en los que no lo tenían, y "Publicar/Despublicar" con color + sombra propios para que se lea como la única acción primaria de la barra (Guardar y Ver página quedan deliberadamente más discretos). Verificado con capturas locales (Playwright contra una ruta de debug con datos de ejemplo, borrada antes de este commit) porque `linkhub-pi.vercel.app` sigue sin ser alcanzable desde esta sesión — si algo puntual sigue sin convencer en producción, señalarlo con una captura nueva.
- Rediseño de la barra superior del editor (`EditorTopBar.tsx`), tercera vuelta tras confirmar por captura que las dos anteriores no habían llegado a producción todavía: deja de ser una fila de botones sueltos y pasa a agruparse como una toolbar real — atrás + nombre de página + una insignia de estado ("En vivo" con punto verde / "Borrador · sin publicar") separados por un divisor; deshacer/rehacer y el selector de dispositivo (móvil/tablet/escritorio) se unifican en un solo bloque con fondo gris y separador interno, en vez de íconos sueltos flotando en la barra. "Publicar" ahora es un botón sólido de tinta (`#1A1B1C`) con sombra — la acción por defecto cuando la página no está en vivo — y "Despublicar" pasa a un botón outline en rojo (fondo blanco, borde rojo claro) para que se lea como la acción ocasional y algo destructiva que es, no como un gemelo más oscuro de "Publicar". Verificado en 1440px, 900px y 420px de ancho para confirmar que el colapso a solo íconos en pantallas chicas no rompe nada.
- Cuarta vuelta de diseño del editor, esta vez sobre el panel de propiedades (`PropertiesPanel.tsx`): las tarjetas `Section` ganan sombra real (elevación) y un divisor entre el título y los campos, en vez de apoyarse solo en un cambio de gris casi imperceptible contra el fondo. Se agregan dos componentes compartidos usados en los ~6 patrones de "lista de cosas" del panel (categorías de menú, productos, tipos de entrada, redes sociales, ítems de bloque destacado): `AddButton` (con ícono `+`, antes solo texto) y `RemoveButton` (un botón circular con ícono `X` y hover, reemplazando un carácter "✕" suelto sin ningún estilo de botón). Las filas anidadas (categoría → producto) suman una numeración en una chapita circular ("1", "2"...) para que la jerarquía se lea de un vistazo, y el nivel más anidado (producto dentro de categoría) pasa a fondo gris dentro de la tarjeta blanca de la categoría, en vez de blanco sobre blanco.

## 🔲 Repaso del editor — pendiente real, sin cerrar todavía

Con las dos pasadas de esta sesión (tipografía/espaciado, y ahora jerarquía visual) se cubrió todo lo señalado explícitamente hasta el momento. No hay una lista cerrada de qué más falta — si el editor real en producción sigue sin convencer en algún punto puntual, lo más útil es señalarlo con una captura nueva en vez de que seguir adivinando qué retocar.

## 🔲 Revisar costos por uso (no por bloque)

Duda planteada: ¿entradas a eventos y tarjeta de sellos consumen más que un LinkHub simple? Repuesta corta: los bloques en sí no cuestan nada (son filas en Postgres) — lo que sí escala con uso es **Resend** (emails de tickets, gratis hasta 3k/mes y después cobra por email) y cualquier futura API paga de terceros (por eso se descartó QR Monster, ver arriba). Mercado Pago/Stripe no cuestan — generan ingreso.

Antes de tocar el modelo de planes, conviene:
1. Medir cuánto está consumiendo Resend realmente una vez que haya tráfico (hoy: 0, no hay credenciales cargadas).
2. Si hace falta, meter un límite de uso (ej. "X emails de entradas incluidos por mes en Pro, después $Y por email o hay que cargar tu propia `RESEND_API_KEY`") en vez de mover bloques entre Free/Pro — mantiene el modelo de 2 planes simple y solo mide donde el costo real vive.
3. No es urgente mientras no haya volumen real de ventas/entradas — anotado para revisar con números concretos de Supabase/Resend/Vercel cuando el proyecto tenga tráfico.

## 🔲 Repaso del editor de bloques (pedido explícito, sin lista cerrada todavía)

El usuario pidió repasar el editor completo ("desde donde se colocan los bloques y configuran, aún le faltan ajustes") sin especificar una lista cerrada de cambios. Ya se resolvió el caso concreto que señaló (bloques invisibles en el editor hasta configurarlos, ver ✅ Hecho) y la subida de imágenes quedó especificada arriba. Falta: sentarse con el usuario a puntualizar qué más le resulta incómodo del editor antes de tocar nada más -- no hay que asumir cambios sin confirmar qué exactamente no le cierra.

## 🔲 Media kit / páginas con plantilla — mejoras futuras

La v1 (ver ✅ Hecho) cubre los 3 casos pedidos con plantillas fijas hardcodeadas. Ideas para una vuelta futura si hace falta más:
- Más plantillas (ej. "portfolio", "restaurante", "evento" reusando el patrón de `buildEventExample` en `demoPage.ts`)
- Dejar que el usuario edite/guarde sus propias plantillas a partir de una página existente ("Duplicar como plantilla"), no solo las 3 fijas
- Miniatura visual de cada plantilla en el picker en vez de solo icono + texto

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

## 🔲 Plan Agencia / marca blanca (revendedores) — solo anotado, no construir todavía

Idea planteada por el usuario para motivar a que la gente venda y revenda LinkHub, más allá del programa de afiliados (comisión por traer clientes): un plan "Agencia" que permita a alguien administrar varias páginas de distintos clientes bajo su propia marca (dominio propio ya existe como feature — ver `custom_domains` más abajo —, faltaría poder ocultar "Hecho con LinkHub", logo propio en el dashboard del cliente final, y un nivel de cuenta que agrupe/facture varias páginas de terceros). **Explícitamente pospuesto por el usuario** ("no me complicaría con eso aún") — no iniciar sin que lo pida. Cuando se retome, conviene separarlo en dos partes que no dependen una de la otra: (1) marca blanca real (ocultar branding de LinkHub, dominio propio — technically most of this exists already) y (2) multi-tenencia (una cuenta administrando páginas de terceros, con su propia facturación) — la (2) es la que de verdad requiere un modelo de datos nuevo (`profiles` no tiene hoy noción de "cuenta que administra a otras cuentas").

## 🔲 Otras ideas sueltas de la comparación con la competencia

- Verificación de dominio propio con UI (la tabla `custom_domains` existe en la base pero no hay pantalla)
- Mensaje "sin comisión sobre tus ventas" en el pricing una vez que haya ventas de productos — es diferencial real vs. Linktree (12%) y Beacons (9%)
