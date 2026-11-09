// Concatenates supabase/migrations/011..021 into one script for the Supabase
// SQL editor. Run: npm run sql:bundle [from] [to]  (default 11 21 → supabase/bundles/011-021.sql;
// use `npm run sql:bundle 1 21` for a brand-new, empty project).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const FROM = Number(args[0] ?? 11), TO = Number(args[1] ?? 22)
const dir = new URL('../supabase/migrations/', import.meta.url)
const files = readdirSync(dir).filter(f => /^\d{3}_.*\.sql$/.test(f)).filter(f => { const n = Number(f.slice(0, 3)); return n >= FROM && n <= TO }).sort()

const precheck = FROM > 1 ? `
do $$
begin
  if to_regclass('public.profiles') is null or to_regclass('public.pages') is null
     or to_regclass('public.analytics_events') is null or to_regclass('public.email_subscribers') is null then
    raise exception 'Faltan las migraciones 001-010: aplícalas primero (o genera el script desde la 001).';
  end if;
end $$;
` : ''
const header = `-- ============================================================================
-- LinkHub · migraciones ${String(FROM).padStart(3, '0')} a ${String(TO).padStart(3, '0')} en un solo script
-- Generado desde supabase/migrations/ (no editar a mano: regenerar con \`npm run sql:bundle\`).
-- Pégalo en Supabase → SQL Editor del proyecto de STAGING.
${FROM > 1 ? '-- Antes: 001–010 deben estar aplicadas (este script lo comprueba).' : '-- Solo para un proyecto NUEVO y vacío: la migración 001 no es idempotente.'}
-- Todo va en una transacción: si algo falla no queda nada a medias.
-- Las migraciones son idempotentes: volver a ejecutarlo es seguro.
-- NO lo ejecutes en producción sin haberlo probado en staging.
-- ============================================================================
begin;
${precheck}`
const footer = `
-- ───────────────────────── Verificación ─────────────────────────
-- Debe devolver 'ok' en todas las filas.
select 'tabla ' || t as comprobacion,
       case when to_regclass('public.' || t) is not null then 'ok' else 'FALTA' end as estado
from unnest(array['processed_webhook_events','admin_audit_log','payment_events','feature_flags','feature_flag_overrides','api_keys','api_key_audit','knowledge_entries','roadmap_votes','custom_domains']) as t
union all
select 'columna profiles.billing_lapsed_at',
       case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='billing_lapsed_at') then 'ok' else 'FALTA' end
union all
select 'columna custom_domains.status',
       case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='custom_domains' and column_name='status') then 'ok' else 'FALTA' end;

commit;
`
const body = files.map(f => `\n-- ───────────────────────── ${f} ─────────────────────────\n${readFileSync(new URL(f, dir), 'utf8').trimEnd()}\n`).join('')
mkdirSync(new URL('../supabase/bundles/', import.meta.url), { recursive: true })
const name = `${String(FROM).padStart(3, '0')}-${String(TO).padStart(3, '0')}.sql`
writeFileSync(new URL(`../supabase/bundles/${name}`, import.meta.url), header + body + footer)
console.log(`Bundled ${files.length} migrations into supabase/bundles/${name}`)
