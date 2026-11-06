import { NextRequest } from 'next/server'
import { handleMcp, MAX_AUTH_BODY } from '@/lib/mcp/protocol'
import { RPC } from '@/lib/mcp/types'
import { authDeps, authenticate, clientIp, mcpDeps } from '@/lib/mcp/server'

// MCP over Streamable HTTP: stateless, JSON responses (no SSE, no sessions).
// POST only; GET/DELETE answer 405 as the spec requires of servers that don't
// offer a server->client stream. Docs: docs/developers/mcp.md
//
// CORS: only the PUBLIC tier (no Authorization header) is readable from
// browsers on any origin, without credentials. The preflight deliberately does
// not allow the Authorization header, so keys can't be used from a web page
// (a leaked key in a front-end is the most common way keys leak).
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, MCP-Protocol-Version',
  'Access-Control-Expose-Headers': 'Retry-After',
  'Access-Control-Max-Age': '86400',
}
const BASE = { 'Cache-Control': 'no-store' }

const rpcFail = (code: number, message: string) => ({ jsonrpc: '2.0' as const, id: null, error: { code, message } })

export async function POST(request: NextRequest) {
  const anonymous = !request.headers.get('authorization')
  const headers: Record<string, string> = { ...BASE, ...(anonymous ? CORS : {}) }
  try {
    const ip = clientIp(request)
    const auth = await authenticate(request.headers.get('authorization'), ip, authDeps())
    if (!auth.ok) {
      return Response.json(rpcFail(RPC.AUTH_REQUIRED, auth.message), {
        status: auth.status,
        headers: { ...headers, ...(auth.status === 401 ? { 'WWW-Authenticate': 'Bearer realm="linkhub-mcp", error="invalid_token"' } : {}), ...(auth.retryAfterSec ? { 'Retry-After': String(auth.retryAfterSec) } : {}) },
      })
    }
    const declared = Number(request.headers.get('content-length') ?? 0)
    if (declared > MAX_AUTH_BODY) return Response.json(rpcFail(RPC.INVALID_REQUEST, 'Petición demasiado grande'), { status: 413, headers })

    const result = await handleMcp(await request.text(), { deps: mcpDeps(!!auth.principal), principal: auth.principal, ip })
    if (result.body === undefined) return new Response(null, { status: result.status, headers })
    return Response.json(result.body, { status: result.status, headers: { ...headers, ...result.headers } })
  } catch (e) {
    console.error('mcp route failed', e)
    return Response.json(rpcFail(RPC.INTERNAL, 'Error interno'), { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...BASE, ...CORS } })
}

const notAllowed = () => new Response(JSON.stringify(rpcFail(RPC.INVALID_REQUEST, 'Usa POST (JSON-RPC 2.0). Este servidor no ofrece stream SSE.')), {
  status: 405, headers: { ...BASE, ...CORS, Allow: 'POST, OPTIONS', 'Content-Type': 'application/json' },
})
export const GET = notAllowed
export const DELETE = notAllowed
