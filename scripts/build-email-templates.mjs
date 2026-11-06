// Regenerates supabase/email-templates/*.html from src/lib/emailTemplates.ts,
// so the design lives in ONE place. Run: npm run emails:build
import { mkdirSync, writeFileSync } from 'node:fs'
import { AUTH_TEMPLATES } from '../src/lib/emailTemplates.ts'

const dir = new URL('../supabase/email-templates/', import.meta.url)
mkdirSync(dir, { recursive: true })
for (const t of AUTH_TEMPLATES) {
  writeFileSync(new URL(`${t.key.replace(/_/g, '-')}.html`, dir), t.html)
  writeFileSync(new URL(`${t.key.replace(/_/g, '-')}.subject.txt`, dir), t.subject + '\n')
}
console.log(`Wrote ${AUTH_TEMPLATES.length} templates to supabase/email-templates/`)
