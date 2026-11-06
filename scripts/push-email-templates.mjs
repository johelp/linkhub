// Pushes the Auth email templates to a Supabase project through the Management
// API (so nobody has to paste six templates into the dashboard by hand).
// UNVERIFIED against the live API: run with --dry-run first, on STAGING first.
//
//   SUPABASE_ACCESS_TOKEN=sbp_...  SUPABASE_PROJECT_REF=abcdefgh \
//   node --experimental-strip-types scripts/push-email-templates.mjs [--apply]
import { AUTH_TEMPLATES } from '../src/lib/emailTemplates.ts'

const apply = process.argv.includes('--apply')
const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = process.env.SUPABASE_PROJECT_REF
if (!token || !ref) { console.error('Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF.'); process.exit(1) }

// Field names follow the Management API's auth config: mailer_subjects_<key> / mailer_templates_<key>_content
const body = {}
for (const t of AUTH_TEMPLATES) {
  body[`mailer_subjects_${t.key}`] = t.subject
  body[`mailer_templates_${t.key}_content`] = t.html
}
console.log(`${apply ? 'Applying' : 'Dry run:'} ${AUTH_TEMPLATES.length} templates to project ${ref}`)
for (const t of AUTH_TEMPLATES) console.log(` - ${t.key}: "${t.subject}" (${t.html.length} bytes)`)
if (!apply) process.exit(0)

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
if (!res.ok) { console.error('Failed:', res.status, (await res.text()).slice(0, 300)); process.exit(1) }
console.log('Done.')
