# Resumen ejecutivo — auditoría de LinkHub (rama de trabajo)

**Fecha:** 2026-11-06 · **Método:** revisión estática de código y migraciones + `npm audit`. Sin pruebas en producción.
Esto no es una certificación SOC 2 ni ISO 27001: son controles verificados en código y riesgo residual.

## Estado
- 2 hallazgos **P0** (dependencia Next.js con RCE/cache poisoning; JSON-LD con XSS almacenado) → **corregidos en código**.
- 5 hallazgos **P1/P2** corregidos en código; 4 requieren **acciones tuyas** (aplicar migración, rotar claves, Vercel/Supabase).
- Quedan abiertos: CSP completa con nonces, rate limiting, cifrado de tokens de Mercado Pago, MFA de admin, pruebas automatizadas.

## Decisiones humanas pendientes
1. **Rotar las claves de Supabase** que estuvieron en el historial de Git (`bfa6220`, `c8a5f31`); siguen válidas hasta rotarlas. Reescribir historial no basta.
2. **Aplicar `supabase/migrations/011_security_hardening.sql`** (límite/MIME de imágenes, RLS de inserciones públicas, trigger de dominios, plan de bloques). No se pudo aplicar desde esta sesión.
3. Elegir proveedor de **rate limiting** (Vercel WAF / Upstash) para login, suscripción, `/api/pay`.
4. Moderación: hoy el dueño puede **volver a publicar** una página que el admin despublicó. ¿Agregar columna `moderated`?
5. Validar con asesoría legal la normativa de datos (Ley 25.326, RGPD) y los textos de privacidad.

Evidencia: `07-evidencia/`. Detalle: `03-hallazgos.md`, `05-plan-remediacion.md`, `04-matriz-controles.csv`.
