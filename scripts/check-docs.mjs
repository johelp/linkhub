#!/usr/bin/env node
// Advisory check: warns when code that must be documented changed but docs/ did not.
// Never fails the build (always exits 0). Usage: BASE_REF=origin/main node scripts/check-docs.mjs
import { execFileSync } from 'node:child_process'

const base = process.env.BASE_REF || 'origin/main'
let files
try {
  files = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' }).split('\n').filter(Boolean)
} catch (e) {
  console.log(`check-docs: could not diff against ${base} (${e.message.split('\n')[0]}); skipping.`)
  process.exit(0)
}

const WATCH = [
  [/^supabase\/migrations\//, 'migraciones -> docs/developers/migraciones-y-entornos.md'],
  [/^src\/app\/api\//, 'rutas API -> docs/developers/arquitectura.md (y mcp.md / api-keys-y-integraciones.md si aplica)'],
  [/^src\/lib\/mcp\//, 'MCP -> docs/developers/mcp.md'],
  [/^src\/lib\/flags\.ts$/, 'flags -> docs/developers/arquitectura.md'],
  [/^src\/lib\/payments(\/|\.ts$)/, 'pasarelas -> docs/developers/agregar-una-pasarela-de-pago.md'],
  [/^\.env\.local\.example$/, 'variables de entorno -> docs/developers/migraciones-y-entornos.md'],
]
const touched = WATCH.filter(([re]) => files.some(f => re.test(f)))
const docsChanged = files.some(f => f.startsWith('docs/'))

if (touched.length && !docsChanged) {
  const msg = `Cambios que requieren documentación sin ningún cambio en docs/: ${touched.map(t => t[1]).join('; ')}. Ver "Política de documentación" en AGENTS.md.`
  console.log(`::warning title=Documentación pendiente::${msg}`)
  console.log(msg)
} else {
  console.log('check-docs: ok')
}
process.exit(0)
