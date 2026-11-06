# Dominios propios (enlaces personalizados) con coste extra

> Análisis de compatibilidad. **Implementado en versión manual y tras el flag `custom_domain`** (verificación TXT + activación manual en `/admin/domains`; ver `docs/operacion/dominios-propios.md`). Siguen sin hacer: alta automática en Vercel, cobro del complemento y redirección 301. Las cifras de precio/límites de proveedores son orientativas y deben verificarse.

## 1. Qué se vende
Que `www.mipsicologa.com` (o `reservas.midespacho.es`) muestre la página de LinkHub, con HTTPS y sin la marca de LinkHub en la URL. Para el cliente: imagen profesional, SEO propio, confianza. Para ti: **ingreso recurrente (complemento)** y retención (cambiar de plataforma implica cambiar de dominio).

## 2. Compatibilidad técnica con la arquitectura actual
La app ya genera las páginas en `/p/[slug]` (ISR) y tiene `proxy.ts`. Un dominio propio es, en esencia, **reescribir `Host: dominio-cliente` → `/p/{slug}`**.

| Pieza | Enfoque | Notas |
|---|---|---|
| Enrutado | En `proxy.ts`: si `Host` no es un host de la plataforma, buscar el dominio verificado y `rewrite` a `/p/{slug}`; bloquear cualquier otra ruta (`/dashboard`, `/api`, `/admin`) en hosts de cliente. | Cacheable. No cambia el renderizado. |
| Alta del dominio | API de dominios de **Vercel** (`POST /v10/projects/{id}/domains`) añade el dominio al proyecto y emite el certificado automáticamente. | Requiere token de Vercel con alcance al proyecto. Verificar límites de dominios por proyecto del plan. |
| DNS del cliente | Subdominio (`www`/`reservas`): `CNAME → cname.vercel-dns.com`. Dominio raíz (apex): registro `A` a la IP indicada por Vercel (o delegar a los *nameservers* de Vercel). | El apex es lo que más tickets de soporte genera: recomendar `www` y redirigir el apex en su registrador. |
| Verificación de propiedad | Registro TXT `_linkhub-verify` con un token por dominio, **antes** de servir nada. | Evita *domain takeover* y que alguien reclame un dominio ajeno. |
| SSL | Automático por Vercel (Let's Encrypt). | Renovación sin intervención. |
| SEO | `canonical` al dominio propio; `sitemap`/`robots` por host; datos estructurados con la URL del dominio. | La URL `/p/slug` debe redirigir 301 al dominio propio para no duplicar. |
| Analíticas | Sin cambios (se guarda `page_id`). | Referrer/UTM sigue funcionando. |
| Cookies/sesión | Las páginas públicas no usan sesión: no hay riesgo de fuga entre dominios. | No servir `/auth` ni `/dashboard` en hosts de cliente. |
| Cobros/WhatsApp/QR | Las URLs de retorno de pago y los QR deben usar el dominio propio si existe. | Ajustar `absoluteUrl` por página. |
| Plan "en pausa" | El dominio propio también muestra la pantalla de pausa. | Ya cubierto: se decide por página. |

### Alternativa a escala: Cloudflare for SaaS
Si los dominios crecen a cientos/miles, un proxy de "custom hostnames" (Cloudflare for SaaS) desacopla el límite de Vercel y añade WAF/caché. Coste por hostname a partir de cierto volumen (verificar tarifas vigentes). Se puede empezar con Vercel y migrar sin cambiar el modelo de datos.

## 3. Modelo de negocio (propuesta)
- **Complemento "Dominio propio"**: suscripción adicional por dominio (propuesta inicial **entre 3 y 5 €/mes** o 30–45 €/año; USD/MXN equivalentes). El cliente **trae su dominio** (lo compra en su registrador). Opción futura: reventa de dominios (margen pequeño, más soporte; no recomendable al inicio).
- **Coste marginal para ti:** casi nulo con Vercel (certificado incluido) hasta el límite del plan; soporte DNS es el coste real → el **onboarding asistido** (asistente con comprobador de DNS) lo reduce.
- **Facturación:** segundo `price` de Stripe por moneda (`STRIPE_PRICE_ID_DOMAIN_*`) como *item* adicional de la misma suscripción, con cantidad = nº de dominios. Entitlement: `profiles.domain_slots`.
- Hoy el plan Pro anuncia "Dominio propio" como incluido. **Decisión pendiente:** (a) incluir 1 dominio en Pro y cobrar los adicionales, o (b) sacarlo de Pro y venderlo como complemento. Recomendación: **(a)** para no perder valor percibido, con extra por dominios adicionales y por "email profesional" (futuro).

## 4. Plan de implementación (≈ 1–2 semanas)
1. Migración: `custom_domains` (ya existe) + `status` (pending/verified/active/error), token de verificación, `last_checked_at`.
2. Servicio `lib/domains.ts`: normalizar (minúsculas, punycode, rechazar hosts de la plataforma y IPs), alta/baja en Vercel, comprobación de DNS (DNS-over-HTTPS) y estado.
3. Asistente en el panel ("Dominio propio"): instrucciones por registrador, botón "Comprobar", estados claros.
4. `proxy.ts`: rewrite por host con caché en memoria corta; `canonical` y redirecciones 301.
5. Facturación del complemento y límite por plan (`domain_slots`).
6. Pruebas: normalización/validación, rewrite, bloqueo de rutas privadas, verificación TXT, caída de DNS.
7. Seguridad: rate limit en alta de dominios, auditoría, impedir *dangling* (si se baja la suscripción, quitar el dominio de Vercel).

## 5. Riesgos y mitigaciones
- *Domain takeover* / reclamar dominio ajeno → verificación TXT obligatoria.
- Soporte DNS → asistente + comprobador + plantillas por registrador.
- Límites de Vercel → monitorizar; plan B Cloudflare for SaaS.
- Contenido duplicado → canonical + 301.
- Pausa por impago → el dominio queda apuntando a la pantalla de pausa (decisión de negocio: mantenerlo o liberarlo tras N días).
