// Money helpers shared by every provider route (pure, no server imports).
export function validMoney(price: number, currency: string): boolean {
  return Number.isFinite(price) && price > 0 && price <= 10_000_000 && /^[A-Z]{3}$/.test(currency)
}

// Stripe's smallest-unit rules: most currencies have 2 decimals, a few have 0.
const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'])
export function toMinorUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100)
}
