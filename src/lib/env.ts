// Which environment is this deployment? Set NEXT_PUBLIC_APP_ENV in Vercel:
//   production  -> main branch / real domain
//   staging     -> `staging` branch / staging domain (separate Supabase project)
// Anything else (preview, local) behaves like staging for safety.
export type AppEnv = 'production' | 'staging' | 'development'

export function appEnv(): AppEnv {
  const v = process.env.NEXT_PUBLIC_APP_ENV
  if (v === 'production' || v === 'staging') return v
  return process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV ? 'production' : process.env.VERCEL_ENV === 'production' ? 'production' : 'development'
}
export const isProduction = () => appEnv() === 'production'
