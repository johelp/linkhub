# Runbooks

## 1. Secreto expuesto (claves de Supabase, Stripe, MP, Resend)
1. **Contener:** revocar/rotar primero la credencial de mayor alcance (Supabase `service_role`, luego `anon`; Stripe secret; MP client secret; Resend).
2. Actualizar variables en Vercel (Production y Preview) y **redeploy**.
3. No borrar logs ni reescribir historial hasta guardar evidencia (commit, fecha, quién accedió). Reescribir historial no invalida una clave ya filtrada.
4. Revisar actividad anómala: Supabase Logs/Auth, Stripe Dashboard → Developers → Events, MP → actividad.
5. Si hubo acceso a datos personales: evaluar notificación (RGPD 72 h / Ley 25.326) con asesoría legal.
6. Registrar el incidente y la causa raíz en `08-excepciones.md` o un post-mortem.

## 2. Rotar `TOKEN_ENCRYPTION_KEY`
1. Generar nueva clave. 2. Con la **vieja** definida, exportar tokens descifrados no es necesario: ejecutar el script con ambas claves es un cambio de código; el camino simple es pedir a los vendedores que **reconecten** Mercado Pago (los tokens nuevos se cifran con la clave nueva) y borrar las filas antiguas. 3. Primera activación: `node --experimental-strip-types scripts/encrypt-existing-tokens.mjs` (vista previa) y luego `--apply`.

## 3. Restaurar la base de datos
1. Supabase → Database → Backups/PITR: elegir el punto previo al incidente. 2. Restaurar en un **proyecto nuevo** primero y verificar tablas clave (`pages`, `profiles`, `payments`, `tickets`). 3. Cambiar variables de Vercel al proyecto restaurado. 4. **Probar la restauración al menos una vez al trimestre** (control A1.2): anotar fecha, duración (RTO) y pérdida de datos (RPO) en `07-evidencia/`.

## 4. Parchear una vulnerabilidad de dependencia
1. `npm audit --omit=dev`; consultar el aviso oficial y KEV de CISA. 2. Actualizar en rama, `npm test && npm run build`. 3. Vista previa de Vercel → probar editor, página pública y checkout en test. 4. Merge y verificar. Explotación activa o RCE sin autenticación = P0 (24 h).

## 5. Dar de baja una página (moderación)
Panel `/admin/pages` → despublicar. Desde la migración 013 el dueño no puede volver a publicarla; para restaurarla, un admin la publica de nuevo. Queda registro en `admin_audit_log`.

## 6. Aplicar migraciones
`supabase db push` (o SQL editor) en **staging primero**: 011 (endurecimiento), 012 (estadísticas del dashboard), 013 (idempotencia, bitácora, moderación, límites). Cada una es idempotente.
