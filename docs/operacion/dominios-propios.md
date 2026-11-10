# Dominios propios de clientes: manual de operación

Flujo **manual** (sin token de Vercel): el cliente configura su DNS, el servidor comprueba que es suyo, y tú lo activas en Vercel y en `/admin/domains`.

## Activar la función
1. Aplica la migración `021_custom_domains.sql` (staging primero).
2. Enciende el flag `custom_domain` en `/admin/features` (primero para un cliente piloto con override; los administradores siempre lo ven).
3. Solo planes Pro (`PLAN_LIMITS.pro.customDomain`).

## Qué ve y hace el cliente (`/dashboard/domain`)
1. Escribe su dominio (recomendado: `www.` o un subdominio).
2. Crea dos registros en su proveedor: un **TXT** `_linkhub-verify[.sub]` = `linkhub-verify=<token>` (prueba de propiedad) y el de apuntado (**CNAME** `cname.vercel-dns.com` para subdominios; **A** `76.76.21.21` para un dominio raíz).
3. Pulsa «Comprobar ahora»: el servidor consulta el TXT. Si coincide pasa a **Verificado**.

## Qué haces tú (`/admin/domains`)
1. Un dominio **Verificado** aparece con el botón «Activar».
2. En Vercel: Project → Settings → Domains → Add → el dominio. Espera a que salga válido (certificado emitido).
3. Pulsa «Activar». Desde ese momento `proxy.ts` sirve la página en ese host (caché de hasta 60 s).
4. Si el cliente quita el dominio, **bórralo también de Vercel** para no dejarlo colgando.

## Qué se sirve en un dominio de cliente
Solo la página pública (`/`), `llms.txt`, `facts.json`, `contact.vcf`, `opengraph-image` y los endpoints que la página necesita (`/api/pay/*`, `/api/subscribers`, `/api/loyalty`, `/api/tickets`, `/t/*`, `/_next/*`). Todo lo demás (dashboard, editor, admin, auth, resto de `/api`) responde 404 en esos hosts. Un host que no es de ningún cliente activo (incluido el dominio de producción, el subdominio de pruebas y las previews) se trata como la propia plataforma y sirve la web normal.

## Límites conocidos
- Tras un pago, la pasarela vuelve al dominio de la plataforma, no al del cliente.
- La URL `/p/<slug>` sigue funcionando (el `canonical` apunta al dominio propio; no hay redirección 301).
- La detección de dominio raíz usa una lista corta de sufijos (`com.ar`, `com.mx`, `co.uk`…): ante la duda se recomienda `www.`.
- Un cliente solo puede tener un dominio por página.
- No hay cobro específico del complemento todavía: va incluido en Pro (pendiente decidir precio, ver `docs/estrategia/dominios-propios.md`).
- Sin verificar contra Postgres ni Vercel reales.

## Subdominio de pruebas con Cloudflare
Para `linkhub.johelpastorino.com`: CNAME `linkhub` → `cname.vercel-dns.com` con el proxy en gris, y añadir el dominio en Vercel. El mismo patrón sirve para probar un dominio de cliente.
