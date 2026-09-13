import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { absoluteUrl } from '@/lib/utils'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('stripe_customer_id').eq('id', user.id).single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No hay una suscripción activa' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: absoluteUrl('/dashboard/upgrade'),
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe billing portal error', err)
    return NextResponse.json({ error: 'No se pudo abrir el portal de facturación' }, { status: 500 })
  }
}
