import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Service-role client — bypasses RLS. Only for trusted server-side code that
// isn't running inside a user's session, e.g. the Stripe webhook handler,
// which authenticates via Stripe's signature instead of a Supabase cookie.
// Never import this from a client component or expose it to the browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
