import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolvePayable } from '@/lib/payments/payable'
import { chooseProvider } from '@/lib/payments/meta'
import type { PaymentProvider } from '@/types'
import { absoluteUrl } from '@/lib/utils'

// Public entry point behind every "pay" button on a page. It resolves WHAT is
// being bought from the stored page, picks the seller's gateway for that
// currency, and forwards to the provider-specific route with the same query.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const pageId = sp.get('pageId'), blockId = sp.get('blockId'), tierId = sp.get('tierId')
  const fail = (slug: string | null, reason: string) => slug
    ? NextResponse.redirect(absoluteUrl(`/p/${slug}?payment_error=${reason}`))
    : new NextResponse('Esta página no existe o ya no está publicada.', { status: 404 })
  if (!pageId || !blockId) return new NextResponse('Falta información para iniciar el pago.', { status: 400 })

  const supabase = await createClient()
  const { payable, error } = await resolvePayable(supabase, { pageId, blockId, tierId })
  if (!payable) return error === 'unpublished' ? fail(null, '') : new NextResponse('Producto no disponible.', { status: 404 })

  const { data } = await createAdminClient().from('payment_connections').select('provider').eq('user_id', payable.page.user_id)
  const provider = chooseProvider((data ?? []).map(r => r.provider as PaymentProvider), payable.currency, payable.provider)
  if (!provider) return fail(payable.page.slug, 'not_configured')

  const target = new URL(absoluteUrl(`/api/pay/${provider}`))
  sp.forEach((v, k) => target.searchParams.set(k, v))
  return NextResponse.redirect(target)
}
