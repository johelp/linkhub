// Why did a server-side database read fail? Admin screens used to say "apply
// migration X" for ANY error, which hid the real cause (an invalid service key).
export type DbFailure = 'key' | 'missing' | 'other'

interface DbErrorLike { code?: string | null; message?: string | null; status?: number | null }

export function classifyDbError(err: DbErrorLike | null | undefined): DbFailure | null {
  if (!err) return null
  const text = `${err.message ?? ''}`.toLowerCase()
  if (err.status === 401 || err.status === 403 || err.code === 'PGRST301' || /invalid api key|jwt|apikey|unauthori[sz]ed/.test(text)) return 'key'
  if (err.code === '42P01' || err.code === 'PGRST205' || err.code === '42703' || /does not exist|could not find the table|schema cache/.test(text)) return 'missing'
  return 'other'
}

export function dbFailureMessage(kind: DbFailure, migration: string): string {
  if (kind === 'key') return 'La base de datos rechaza la clave de servidor (SUPABASE_SERVICE_ROLE_KEY): es inválida o de otro proyecto. Cámbiala en Vercel (Settings → Environment Variables) y redespliega. Las migraciones no tienen nada que ver.'
  if (kind === 'missing') return `Falta aplicar la migración ${migration}.`
  return `No se pudo leer la base de datos (migración ${migration} o conexión). Revisa los registros del servidor.`
}
