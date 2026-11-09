# Resumen ejecutivo — auditoría de LinkHub (rama de trabajo)

**Fecha:** 2026-11-06 · **Método:** revisión estática de código y migraciones + `npm audit`. Sin pruebas en producción.
Esto no es una certificación SOC 2 ni ISO 27001: son controles verificados en código y riesgo residual.

## Estado
- 2 hallazgos **P0** (dependencia Next.js con RCE/cache poisoning; JSON-LD con XSS almacenado) → **corregidos en código**.
- 5 hallazgos **P1/P2** corregidos en código; 4 requieren **acciones tuyas** (aplicar migración, rotar claves, Vercel/Supabase).
- Resuelto en la segunda ronda: cifrado de tokens de Mercado Pago, idempotencia de Stripe, límites anti-spam en la base, moderación, bitácora de admin, CSP estricta en áreas privadas, 16 tests y CI.
- Quedan abiertos (acciones tuyas): rotar claves, aplicar migraciones 011-013, definir `TOKEN_ENCRYPTION_KEY`, proteger `main`, MFA en la cuenta admin, probar una restauración de backup.

## Decisiones humanas pendientes
1. **Rotar las claves de Supabase** que estuvieron en el historial de Git (`bfa6220`, `c8a5f31`); siguen válidas hasta rotarlas. Reescribir historial no basta.
2. **Aplicar `supabase/migrations/011_security_hardening.sql`** (límite/MIME de imágenes, RLS de inserciones públicas, trigger de dominios, plan de bloques), `012` (estadísticas del dashboard) y `013` (idempotencia, bitácora de admin, moderación, límites anti-spam). No se pudo aplicar desde esta sesión.
3. Definir `TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32`) en Vercel y correr `scripts/encrypt-existing-tokens.mjs --apply`.
4. Activar protección de la rama `main` en GitHub (PR obligatorio + checks de CI).
5. Validar con asesoría legal la normativa de datos (Ley 25.326, RGPD) y los textos de privacidad.

Evidencia: `07-evidencia/`. Detalle: `03-hallazgos.md`, `05-plan-remediacion.md`, `04-matriz-controles.csv`.
