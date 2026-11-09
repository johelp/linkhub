import { baseUrl, ownerStore, restAuth, restError } from '@/lib/mcp/server'

// REST mirror of the MCP tool `list_my_pages`. Docs: docs/developers/api-keys-y-integraciones.md
// Contract: public/openapi.json. Requires an API key with scope `pages:read`.
export async function GET(request: Request) {
  const auth = await restAuth(request, 'pages:read')
  if (auth.response) return auth.response
  try {
    const pages = await ownerStore().listPages(auth.principal.userId)
    return Response.json({ data: pages.map(p => ({ ...p, url: `${baseUrl()}/p/${p.slug}` })) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('GET /api/v1/pages failed', e)
    return restError(500, 'internal', 'Error interno')
  }
}
