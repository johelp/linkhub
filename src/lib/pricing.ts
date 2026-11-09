// Regional pricing for the LinkHub subscription (NOT the customers' own sales).
// One place to edit prices. Each region is charged in the currency people there
// actually use; Stripe needs a Price per currency (env var in `priceEnv`).
//
// PROPOSED VALUES: confirm them before launch. Local-currency amounts for
// volatile currencies (ARS) are intentionally avoided: Argentina is shown in USD.
export type RegionId = 'es' | 'ar' | 'mx' | 'latam'

export interface Region {
  id: RegionId
  label: string
  currency: 'EUR' | 'USD' | 'MXN'
  pro: number
  locale: string
  priceEnv: string        // Stripe Price id for this currency
  note?: string
}

export const REGIONS: Region[] = [
  { id: 'es', label: 'España y Europa', currency: 'EUR', pro: 19, locale: 'es-ES', priceEnv: 'STRIPE_PRICE_ID_PRO_EUR' },
  { id: 'ar', label: 'Argentina', currency: 'USD', pro: 20, locale: 'es-AR', priceEnv: 'STRIPE_PRICE_ID_PRO_USD', note: 'Se cobra en dólares con tarjeta, sin sorpresas por inflación.' },
  { id: 'mx', label: 'México', currency: 'MXN', pro: 349, locale: 'es-MX', priceEnv: 'STRIPE_PRICE_ID_PRO_MXN' },
  { id: 'latam', label: 'Resto de Latinoamérica', currency: 'USD', pro: 20, locale: 'es-419', priceEnv: 'STRIPE_PRICE_ID_PRO_USD' },
]

export const DEFAULT_REGION: RegionId = 'es'
export const REGION_COOKIE = 'lh_region'
export const regionById = (id: string | undefined | null): Region => REGIONS.find(r => r.id === id) ?? REGIONS[0]

export function formatPrice(amount: number, currency: string, locale: string): string {
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount) } catch { return `${amount} ${currency}` }
}

// Best guess from the browser, used only as a default (the visitor can change it).
export function guessRegion(language: string | undefined, timeZone: string | undefined): RegionId {
  const lang = (language ?? '').toLowerCase()
  const tz = timeZone ?? ''
  if (lang.endsWith('-ar') || tz === 'America/Argentina/Buenos_Aires' || tz.startsWith('America/Argentina')) return 'ar'
  if (lang.endsWith('-mx') || tz.startsWith('America/Mexico') || tz === 'America/Cancun' || tz === 'America/Tijuana') return 'mx'
  if (/-(cl|co|pe|uy|ve|bo|ec|py|cr|pa|do|gt|hn|ni|sv|pr|cu)$/.test(lang) || /^America\/(Santiago|Bogota|Lima|Montevideo|Caracas|La_Paz|Guayaquil|Asuncion|Costa_Rica|Panama|Santo_Domingo)/.test(tz)) return 'latam'
  return 'es'
}

/** Stripe Price id for a region, falling back to the legacy single-price variable. */
export function stripePriceFor(region: Region): string | undefined {
  return process.env[region.priceEnv] || (region.currency === 'EUR' ? process.env.STRIPE_PRICE_ID_PRO : undefined)
}
