# Estrategia de mercados

> Hipótesis de trabajo. No he podido consultar fuentes externas en esta sesión: las cifras de mercado **no están verificadas** y hay que validarlas con entrevistas y datos reales antes de decidir inversión.

## 1. Tesis
Millones de autónomos y pequeños negocios ya **venden desde Instagram y WhatsApp** y no tienen (ni quieren mantener) una web. Los paneles de enlaces los ayudan a "enlazar"; no les resuelven **reservar, pedir, cobrar ni ser encontrados**. LinkHub se posiciona como **"tu presencia profesional sin necesidad de una web"**: servicios, agenda, pedidos, cobros y visibilidad (Google + asistentes de IA) en un enlace.

Diferenciales defendibles: (1) citas/pedidos por WhatsApp sin comisión, (2) cobros con la pasarela local, (3) visibilidad GEO/SEO/LLM con datos estructurados según el tipo de negocio, (4) base de conocimiento reutilizable (FAQ, `llms.txt`, MCP), (5) puesta en marcha asistida.

## 2. Orden de ataque
1. **España — autónomos y profesionales** (mercado principal): psicología, fisioterapia, abogacía/gestoría, estética, entrenadores, clases.
2. **Argentina** (conoces el mercado y el canal): comercios, servicios, gastronomía; mucha venta por WhatsApp e Instagram.
3. **México** y luego el resto de LatAm (Chile, Colombia, Uruguay, Perú): replicar el paquete argentino con ajustes de moneda/pasarela.

### España
- **Cliente ideal (ICP):** autónomo de servicios con agenda propia (salud, belleza, formación, asesoría) que hoy usa Instagram + WhatsApp + una agenda en papel o Google Calendar.
- **Propuesta:** "Pide cita online sin web, con tu horario y tus precios, y sal en Google".
- **Pasarelas:** Redsys (TPV del banco, ya contratado por muchos autónomos) y Stripe; Bizum es la gran ausencia (evaluar vía Redsys/Stripe cuando esté disponible para tu cuenta).
- **Canales:** SEO local/long-tail ("página web para psicólogos autónomos"), landings por sector (ya existen `/para/*` y `/ejemplos/*`), colegios profesionales y asociaciones de autónomos, comunidades de Instagram, alianzas con gestorías (ven a sus autónomos cada mes), programa de afiliados.
- **Legal (a tratar con asesor):** RGPD/LOPDGDD, LSSI-CE, cookies, IVA (OSS) y facturación; VeriFactu/factura electrónica para autónomos afecta al cliente, no a ti, pero conviene informar.
- **Precio de partida:** Pro en euros (ver `src/lib/pricing.ts`).

### Argentina
- **ICP:** comercios y servicios que ya reciben pedidos por WhatsApp; gastronomía con delivery; profesionales independientes.
- **Pasarela:** Mercado Pago (imprescindible). Pagos en cuotas y transferencia (alias/CBU) son muy usados: evaluar un bloque "Pago por transferencia" (alias, importe, comprobante por WhatsApp).
- **Precio:** el peso es volátil → **cobrar la suscripción en USD** (ya contemplado) y mostrar los precios de los clientes en pesos (sus catálogos sí van en ARS).
- **Canales:** comunidades de emprendedores, cámaras de comercio, creadores de contenido, referidos entre rubros; mucho boca a boca.
- **Fiscal:** monotributo y facturación (AFIP) afectan al cliente; para ti, tratamiento de IVA/exportación de servicios al facturar suscripciones desde el extranjero (**pendiente de asesoría**).

### México y LatAm
- **Pasarela:** Mercado Pago y Stripe (MXN). Evaluar OXXO/SPEI vía Stripe.
- **Canal:** WhatsApp es aún más central; negocios locales, belleza, restaurantes, talleres.
- **Precio:** MXN local (propuesto) y USD para el resto.
- **Fiscal:** SAT/RESICO del cliente; para ti, IVA digital (**pendiente**).

## 3. Producto por fases
- **Ya hecho:** editor, citas y pedidos por WhatsApp, cobros multi-pasarela, vCard, mapa, FAQ + base de conocimiento, GEO/SEO/LLM, ejemplos por nicho, precios por región, paneles de administración, flags y entornos.
- **Siguiente (valor/esfuerzo):** (1) citas fase 2 (guardar solicitudes + bandeja + avisos), (2) ficha de Google (reseñas automáticas — `docs/estrategia/google-business-profile.md`), (3) dominio propio como complemento de pago (`dominios-propios.md`), (4) asistente IA para la página y MCP para clientes (`ia-y-mcp.md`), (5) pago por transferencia y Bizum, (6) recordatorios por WhatsApp/email.

## 4. Métricas que importan
Activación (% que publica su página en 24 h), tiempo hasta la primera visita y la primera solicitud, conversión Free→Pro, retención a 90 días, ingresos por cliente (suscripción + complementos), % de páginas con FAQ y datos completos (calidad GEO), solicitudes/pedidos generados por página (valor entregado).

## 5. Riesgos
Dependencia de WhatsApp (políticas/precios), Redsys y Stripe por país, regulación de datos y fiscal, competidores que añadan reservas, calidad de las páginas (si el cliente no completa datos, no hay GEO). Mitigación: onboarding asistido, plantillas por nicho, puntuación de calidad de la página (idea).
