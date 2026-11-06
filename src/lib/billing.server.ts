import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { availability, graceDays, type Availability } from '@/lib/billing'

// Service role: billing columns aren't readable through the visitor's session.
// If migration 017 isn't applied yet the column is missing -> everyone is "active".
export const getOwnerAvailability = cache(async (userId: string): Promise<Availability> => {
  try {
    const { data, error } = await createAdminClient().from('profiles').select('billing_lapsed_at').eq('id', userId).maybeSingle()
    if (error || !data) return 'active'
    return availability((data as { billing_lapsed_at: string | null }).billing_lapsed_at, Date.now(), graceDays())
  } catch { return 'active' }
})
