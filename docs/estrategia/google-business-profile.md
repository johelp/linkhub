# Integración con Google (ficha de empresa / Business Profile)

> Propuesta por niveles, de menos a más esfuerzo. Los niveles 0 y 1 ya están hechos.

## Nivel 0 — Hecho: que Google entienda tu página
- **Datos estructurados (schema.org)** según el tipo de negocio (`src/lib/seo.ts`): `LocalBusiness`/`Restaurant`/`ProfessionalService`/…, horario, dirección, teléfono, redes (`sameAs`), servicios y precios (`OfferCatalog`/`Menu`), `ReserveAction` si hay citas, `FAQPage` desde la base de conocimiento.
- **Bloque "Mapa de Google"** (iframe) y **"Reseñas de Google"** (puntuación y enlace a reseñas).
- Cómo usarlo el cliente: poner la URL de su página LinkHub como **sitio web** y **enlace de citas/pedidos** en su ficha de Google; usar el QR de reseñas.

## Nivel 1 — Siguiente (bajo coste, sin aprobación de Google)
- **Asistente "Conecta tu ficha de Google"** en el panel: pasos con capturas, enlace con parámetros UTM (`?utm_source=google&utm_medium=business_profile`) para medir cuántas visitas llegan desde la ficha, y generador de QR de "Deja tu reseña" (`https://search.google.com/local/writereview?placeid=...`).
- **Comprobador de coherencia (NAP):** avisa si nombre, dirección y teléfono de la página difieren de la ficha (el cliente los pega) — la consistencia mejora el SEO local.

## Nivel 2 — Reseñas y datos automáticos (Places API)
- Con la *Place ID* del negocio, la **Places API (New)** devuelve puntuación, número de reseñas y reseñas recientes. Rellenaría automáticamente el bloque de reseñas (hoy se escribe a mano) y lo mantendría actualizado.
- Requisitos: clave de API de Google Cloud (facturable por solicitud: cachear 24 h), mostrar la atribución que exige Google, y **no** volcar esas reseñas a `aggregateRating` en schema.org (las políticas de Google lo prohíben para reseñas propias/autogestionadas).
- Coste/valor: bajo coste por cliente; alto valor percibido.

## Nivel 3 — Business Profile APIs (OAuth del cliente)
- Con la autorización del cliente (OAuth) se podría: sincronizar **horario y datos**, publicar **novedades/ofertas** desde LinkHub, **responder reseñas**, leer **métricas** de la ficha.
- Requisitos: solicitud de acceso y aprobación de Google para las APIs de Business Profile, pantalla de consentimiento verificada, políticas estrictas. Es un proyecto de semanas y depende de la aprobación.
- Recomendación: no empezar aquí; validar primero demanda con los niveles 1–2.

## Seguridad y datos
Tokens OAuth cifrados (`src/lib/crypto.ts`), mínimo alcance, revocables desde el panel, auditoría, y cumplimiento de las condiciones de uso de Google.

## Hoja de ruta sugerida
1. Nivel 1 (asistente + UTM + QR reseñas) — 2–3 días.
2. Nivel 2 (Places API) detrás del flag `google_places` — 1 semana.
3. Nivel 3 solo si hay demanda y aprobación de Google.
