import type { PaymentProvider } from '@/types'

// Client-safe description of each gateway (no secrets, no server imports).
export interface ProviderMeta {
  id: PaymentProvider
  name: string
  tagline: string
  region: string
  color: string
  currencies: string[] | 'any'
  setup: 'oauth' | 'credentials'
}

export const PROVIDERS: ProviderMeta[] = [
  { id: 'mercadopago', name: 'Mercado Pago', tagline: 'Tarjetas, dinero en cuenta y medios locales', region: 'Argentina y Latinoamérica', color: '#009EE3', currencies: ['ARS', 'BRL', 'CLP', 'COP', 'MXN', 'PEN', 'UYU'], setup: 'oauth' },
  { id: 'stripe', name: 'Stripe', tagline: 'Tarjetas internacionales, Apple Pay y Google Pay', region: 'Europa, EE. UU. y más de 40 países', color: '#635BFF', currencies: 'any', setup: 'oauth' },
  { id: 'redsys', name: 'Redsys (TPV de tu banco)', tagline: 'El TPV virtual que te da tu banco en España', region: 'España', color: '#C8102E', currencies: ['EUR', 'USD', 'GBP', 'MXN', 'ARS', 'BRL', 'CLP', 'COP', 'PEN', 'UYU'], setup: 'credentials' },
]

export const PROVIDER_BY_ID = Object.fromEntries(PROVIDERS.map(p => [p.id, p])) as Record<PaymentProvider, ProviderMeta>

export function supportsCurrency(provider: PaymentProvider, currency: string): boolean {
  const c = PROVIDER_BY_ID[provider].currencies
  return c === 'any' || c.includes(currency.toUpperCase())
}

// When a block doesn't name a gateway ("auto"), pick the best connected one
// that can charge in the block's currency: local gateways first for LatAm
// currencies, Stripe/Redsys first for EUR.
export function chooseProvider(connected: PaymentProvider[], currency: string, preferred?: PaymentProvider | 'auto'): PaymentProvider | null {
  if (preferred && preferred !== 'auto' && connected.includes(preferred) && supportsCurrency(preferred, currency)) return preferred
  const order: PaymentProvider[] = currency.toUpperCase() === 'EUR' ? ['stripe', 'redsys', 'mercadopago'] : ['mercadopago', 'stripe', 'redsys']
  return order.find(p => connected.includes(p) && supportsCurrency(p, currency)) ?? null
}
