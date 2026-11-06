// Tiny JSON-Schema subset validator. The SAME schema objects are advertised in
// tools/list (inputSchema) and enforced here, so what a model is told and what
// the server accepts can't diverge. Unknown properties are rejected.
export type Schema =
  | { type: 'string'; description?: string; minLength?: number; maxLength?: number; pattern?: string; enum?: readonly string[]; format?: string }
  | { type: 'integer' | 'number'; description?: string; minimum?: number; maximum?: number }
  | { type: 'boolean'; description?: string }
  | { type: 'array'; description?: string; items: Schema; minItems?: number; maxItems?: number }
  | { type: 'object'; description?: string; properties?: Record<string, Schema>; required?: readonly string[]; additionalProperties?: boolean }

export const SLUG_PATTERN = '^[a-z0-9][a-z0-9-]{1,60}[a-z0-9]$'
export const ID_PATTERN = '^[A-Za-z0-9_-]{1,64}$'
export const UUID_PATTERN = '^[0-9a-fA-F-]{36}$'
export const DATE_PATTERN = '^\\d{4}-\\d{2}-\\d{2}$'
export const TIME_PATTERN = '^([01]\\d|2[0-3]):[0-5]\\d$'

// Control characters (except \n and \t) never belong in user-supplied text.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/

export function validate(schema: Schema, value: unknown, path = 'arguments'): string[] {
  const errs: string[] = []
  switch (schema.type) {
    case 'string': {
      if (typeof value !== 'string') return [`${path}: debe ser texto`]
      if (CONTROL.test(value)) errs.push(`${path}: contiene caracteres de control`)
      if (schema.minLength !== undefined && value.length < schema.minLength) errs.push(`${path}: mínimo ${schema.minLength} caracteres`)
      if (schema.maxLength !== undefined && value.length > schema.maxLength) errs.push(`${path}: máximo ${schema.maxLength} caracteres`)
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) errs.push(`${path}: formato inválido`)
      if (schema.enum && !schema.enum.includes(value)) errs.push(`${path}: debe ser uno de ${schema.enum.join(', ')}`)
      if (schema.format === 'date' && !errs.length && !isRealDate(value)) errs.push(`${path}: fecha inexistente`)
      return errs
    }
    case 'integer':
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return [`${path}: debe ser un número`]
      if (schema.type === 'integer' && !Number.isInteger(value)) errs.push(`${path}: debe ser un entero`)
      if (schema.minimum !== undefined && value < schema.minimum) errs.push(`${path}: mínimo ${schema.minimum}`)
      if (schema.maximum !== undefined && value > schema.maximum) errs.push(`${path}: máximo ${schema.maximum}`)
      return errs
    }
    case 'boolean':
      return typeof value === 'boolean' ? [] : [`${path}: debe ser verdadero o falso`]
    case 'array': {
      if (!Array.isArray(value)) return [`${path}: debe ser una lista`]
      if (schema.minItems !== undefined && value.length < schema.minItems) errs.push(`${path}: mínimo ${schema.minItems} elementos`)
      if (schema.maxItems !== undefined && value.length > schema.maxItems) return [...errs, `${path}: máximo ${schema.maxItems} elementos`]
      value.forEach((v, i) => errs.push(...validate(schema.items, v, `${path}[${i}]`)))
      return errs
    }
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [`${path}: debe ser un objeto`]
      const obj = value as Record<string, unknown>
      const props = schema.properties ?? {}
      for (const r of schema.required ?? []) if (obj[r] === undefined) errs.push(`${path}.${r}: es obligatorio`)
      for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue
        const sub = props[k]
        if (!sub) { if (schema.additionalProperties !== true) errs.push(`${path}.${k}: propiedad no admitida`); continue }
        errs.push(...validate(sub, v, `${path}.${k}`))
      }
      return errs
    }
  }
}

function isRealDate(s: string): boolean {
  const [y, m, d] = s.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

export const str = (description: string, extra: Partial<Extract<Schema, { type: 'string' }>> = {}): Schema => ({ type: 'string', description, maxLength: 200, ...extra })
export const slugSchema: Schema = { type: 'string', description: 'Slug de la página pública (lo que va después de /p/).', pattern: SLUG_PATTERN, minLength: 3, maxLength: 62 }
