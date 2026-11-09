import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { Page, PaymentButtonBlock, EventTicketsBlock, PaymentProvider } from '@/types'
import { getOwnerAvailability } from '@/lib/billing.server'

export interface Payable {
  page: Page
  blockId: string
  title: string
  price: number
  currency: string
  tier: { id: string; name: string } | null
  provider: PaymentProvider | 'auto'
}

// What is being bought, resolved ONLY from the published page's stored
// blocks -- never from query parameters -- so a visitor can't change a price.
export async function resolvePayable(supabase: SupabaseClient<Database>, params: { pageId: string; blockId: string; tierId: string | null }): Promise<{ payable?: Payable; error?: 'not_found' | 'unpublished' }> {
  const { data } = await supabase.from('pages').select('*').eq('id', params.pageId).eq('published', true).maybeSingle()
  if (!data) return { error: 'unpublished' }
  const page = data as unknown as Page
  if ((await getOwnerAvailability(page.user_id)) === 'paused') return { error: 'unpublished' }
  const block = page.blocks.find(b => b.id === params.blockId && (b.type === 'payment_button' || b.type === 'event_tickets'))
  if (!block) return { error: 'not_found' }
  const lang = page.settings.defaultLang

  if (block.type === 'payment_button') {
    const b = block as PaymentButtonBlock
    const t = b.data.translations[lang] || b.data.translations['es']
    return { payable: { page, blockId: block.id, title: t?.title || page.name, price: b.data.price, currency: b.data.currency, tier: null, provider: b.data.provider ?? 'auto' } }
  }
  const b = block as EventTicketsBlock
  const tier = b.data.tiers.find(x => x.id === params.tierId)
  if (!tier) return { error: 'not_found' }
  const t = b.data.translations[lang] || b.data.translations['es']
  return { payable: { page, blockId: block.id, title: `${t?.title || page.name} — ${tier.name}`, price: tier.price, currency: b.data.currency, tier: { id: tier.id, name: tier.name }, provider: b.data.provider ?? 'auto' } }
}

export { validMoney, toMinorUnits } from './money'
