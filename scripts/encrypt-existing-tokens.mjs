// One-off: encrypt Mercado Pago tokens that were stored before field
// encryption existed. Dry-run by default.
//
//   TOKEN_ENCRYPTION_KEY=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node --experimental-strip-types scripts/encrypt-existing-tokens.mjs          # preview
//   ... node --experimental-strip-types scripts/encrypt-existing-tokens.mjs --apply
import { createClient } from '@supabase/supabase-js'
import { encryptSecret, isEncrypted } from '../src/lib/crypto.ts'

const apply = process.argv.includes('--apply')
if (!process.env.TOKEN_ENCRYPTION_KEY) { console.error('Set TOKEN_ENCRYPTION_KEY first (openssl rand -base64 32).'); process.exit(1) }
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data, error } = await db.from('payment_connections').select('id, access_token, refresh_token')
if (error) { console.error(error.message); process.exit(1) }
let todo = 0
for (const row of data) {
  if (isEncrypted(row.access_token) && isEncrypted(row.refresh_token)) continue
  todo++
  if (!apply) continue
  const { error: e } = await db.from('payment_connections').update({
    access_token: isEncrypted(row.access_token) ? row.access_token : encryptSecret(row.access_token),
    refresh_token: isEncrypted(row.refresh_token) ? row.refresh_token : encryptSecret(row.refresh_token),
  }).eq('id', row.id)
  if (e) { console.error('row', row.id, e.message); process.exit(1) }
}
console.log(`${apply ? 'Encrypted' : 'Would encrypt'} ${todo} of ${data.length} connection(s).`)
