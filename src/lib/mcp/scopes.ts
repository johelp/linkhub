// API-key permissions. Kept free of server-only imports so the dashboard
// (client component) can list them.
export const SCOPES = ['pages:read', 'pages:write', 'knowledge:read', 'knowledge:write', 'analytics:read', 'payments:read'] as const
export type Scope = typeof SCOPES[number]

export const SCOPE_LABEL: Record<Scope, string> = {
  'pages:read': 'Leer tus páginas',
  'pages:write': 'Modificar tus páginas',
  'knowledge:read': 'Leer la base de conocimiento',
  'knowledge:write': 'Crear y editar la base de conocimiento',
  'analytics:read': 'Leer analíticas',
  'payments:read': 'Leer el historial de cobros',
}

export const isScope = (v: unknown): v is Scope => typeof v === 'string' && (SCOPES as readonly string[]).includes(v)
