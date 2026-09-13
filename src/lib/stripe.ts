import Stripe from 'stripe'

let _stripe: Stripe | null = null

// Lazily instantiated so importing this module doesn't crash routes/builds
// in environments where Stripe isn't configured yet.
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key)
  }
  return _stripe
}
