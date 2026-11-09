import crypto from 'node:crypto'

// Feature flags. The code owns the list (so a flag can't be misspelled and the
// app works even before the table exists); the database owns the rollout.
// Resolution order for a customer:
//   1. per-customer override (on/off)        -> pilot customers / opt-outs
//   2. flag "enabled for everyone"           -> general availability
//   3. rollout percentage (stable bucket)    -> gradual widening
//   4. the default declared below            -> new features ship OFF
// Platform admins always get every feature, to test in production safely.
export const FLAGS = {
  order_menu_block: { label: 'Bloque Pedidos / Mini tienda', description: 'Catálogo con carrito y pedido por WhatsApp.', default: false },
  appointment_block: { label: 'Bloque Solicitud de citas', description: 'Turnos por WhatsApp para profesionales.', default: false },
  stripe_connect: { label: 'Cobros con Stripe', description: 'Conectar Stripe (Connect) para cobrar online.', default: false },
  redsys: { label: 'Cobros con Redsys', description: 'TPV virtual de banco español.', default: false },
  ai_onboarding: { label: 'Crear página con IA', description: 'Asistente que redacta una primera versión de la página a partir de una descripción del negocio.', default: false },
  custom_domain: { label: 'Dominio propio', description: 'Los clientes Pro conectan su dominio (tu-nombre.com). Cada dominio se activa a mano desde /admin/domains.', default: false },
  developer_api: { label: 'API para desarrolladores', description: 'API keys, servidor MCP autenticado y API REST /api/v1 para integraciones propias.', default: false },
} as const

export type FlagKey = keyof typeof FLAGS
export const FLAG_KEYS = Object.keys(FLAGS) as FlagKey[]
export type FlagMap = Record<FlagKey, boolean>

export interface FlagRow { key: string; enabled_default: boolean; rollout_percent: number }

/** Stable 0–99 bucket per (flag, user): the same customer always lands in the same group. */
export function bucket(key: string, userId: string): number {
  return crypto.createHash('sha1').update(`${key}:${userId}`).digest().readUInt32BE(0) % 100
}

export function evaluateFlag(key: FlagKey, userId: string, row: FlagRow | undefined, override: boolean | undefined): boolean {
  if (override !== undefined) return override
  if (row?.enabled_default) return true
  if (row && row.rollout_percent > 0) return bucket(key, userId) < row.rollout_percent
  return row ? false : FLAGS[key].default
}

export function resolveFlags(userId: string, rows: FlagRow[], overrides: { flag_key: string; enabled: boolean }[], isAdmin = false): FlagMap {
  return Object.fromEntries(FLAG_KEYS.map(k => [k,
    isAdmin || evaluateFlag(k, userId, rows.find(r => r.key === k), overrides.find(o => o.flag_key === k)?.enabled),
  ])) as FlagMap
}

export const BLOCK_FLAG: Partial<Record<string, FlagKey>> = { order_menu: 'order_menu_block', appointment_request: 'appointment_block' }
export const PROVIDER_FLAG: Partial<Record<string, FlagKey>> = { stripe: 'stripe_connect', redsys: 'redsys' }

/** Block types a customer may NOT add, given their flags. */
export function hiddenBlockTypes(flags: FlagMap): string[] {
  return Object.entries(BLOCK_FLAG).filter(([, f]) => f && !flags[f]).map(([type]) => type)
}
