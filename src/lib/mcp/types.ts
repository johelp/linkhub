import type { Block, Page, Plan } from '../../types/index.ts'
import type { KnowledgeEntry } from '../knowledge.ts'
import type { FlagMap } from '../flags.ts'
import type { Limiter } from './rateLimit.ts'
import type { Scope } from './apiKeys.ts'
import type { Schema } from './validate.ts'

// ─── JSON-RPC 2.0 ───────────────────────────────────────────────
export type JsonRpcId = string | number | null
export interface JsonRpcRequest { jsonrpc: '2.0'; id?: JsonRpcId; method: string; params?: unknown }
export interface JsonRpcError { code: number; message: string; data?: unknown }
export type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: JsonRpcId; result: unknown }
  | { jsonrpc: '2.0'; id: JsonRpcId; error: JsonRpcError }

export const RPC = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
  // Implementation-defined range (-32000..-32099)
  AUTH_REQUIRED: -32001,
  INSUFFICIENT_SCOPE: -32003,
  RATE_LIMITED: -32029,
  RESOURCE_NOT_FOUND: -32002, // MCP spec value for resources/read misses
} as const

// ─── Who is calling ─────────────────────────────────────────────
export interface Principal {
  userId: string
  keyId: string
  scopes: Scope[]
  email?: string | null
}

// ─── Data access (implemented over Supabase in store.ts, faked in tests) ──
export interface PageSummary { id: string; slug: string; name: string; published: boolean; updated_at: string; views: number; moderated: boolean }

export interface PublicStore {
  /** Published, indexable (seo.noindex false) and not paused by billing; otherwise null. */
  getPublicPage(slug: string): Promise<Page | null>
  /** PUBLIC knowledge entries for that page (its own + account-wide). Never private ones. */
  getPublicKnowledge(page: Page): Promise<KnowledgeEntry[]>
}

export interface AnalyticsSummary {
  days: number
  pages: { page_id: string; views: number; clicks: number }[]
  topBlocks: { page_id: string; block_id: string; block_type: string | null; clicks: number }[]
  approximateTopBlocks: boolean
}

export interface PaymentRow { id: string; created_at: string; status: string; provider: string; amount: number; currency: string; tier_name: string | null; payer_email: string | null; provider_payment_id: string | null; page_id: string }
export interface PaymentFilters { pageId?: string; status?: string; provider?: string; from?: string; to?: string; limit: number }

/** EVERY method is scoped to `userId`; implementations must never read or write another owner's rows. */
export interface OwnerStore {
  getPlan(userId: string): Promise<Plan>
  listPages(userId: string): Promise<PageSummary[]>
  getPage(userId: string, ref: { id?: string; slug?: string }): Promise<Page | null>
  savePage(userId: string, pageId: string, update: Record<string, unknown>): Promise<{ error?: { message: string } }>
  listKnowledge(userId: string, f: { pageId?: string; kind?: string; visibility?: string }): Promise<KnowledgeEntry[]>
  upsertKnowledge(userId: string, entry: Omit<KnowledgeEntry, 'id' | 'user_id'> & { id?: string }): Promise<{ entry?: KnowledgeEntry; error?: string }>
  deleteKnowledge(userId: string, id: string): Promise<boolean>
  analytics(userId: string, pageIds: string[], days: number): Promise<AnalyticsSummary>
  listPayments(userId: string, f: PaymentFilters): Promise<PaymentRow[]>
}

export interface AuditEntry {
  userId: string
  keyId: string
  action: string
  target?: string
  detail?: Record<string, unknown>
  ip: string
}

export interface McpDeps {
  baseUrl: string
  limiter: Limiter
  publicStore: PublicStore
  owner: OwnerStore
  getFlags(userId: string): Promise<FlagMap>
  /** Must throw if the entry could not be recorded: the write is then refused. */
  audit(entry: AuditEntry): Promise<void>
  now?: () => Date
}

// ─── Tools ──────────────────────────────────────────────────────
export interface ToolContext { deps: McpDeps; principal: Principal | null; ip: string; now: Date }
export interface ToolResult { content: { type: 'text'; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean }

export interface ToolDef {
  name: string
  title: string
  description: string
  /** null = public tier (no key needed). Otherwise the key must carry this scope. */
  scope: Scope | null
  readOnly: boolean
  destructive?: boolean
  idempotent?: boolean
  inputSchema: Extract<Schema, { type: 'object' }>
  run(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult>
}

/** Thrown by tool code for expected failures; becomes a tool result with isError=true. */
export class ToolError extends Error {}

export type { Block, Page }
