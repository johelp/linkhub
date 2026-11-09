import { SLUG_RE } from '@/lib/security'
import { baseUrl, ownerStore, restAuth, restError } from '@/lib/mcp/server'

// One of the key owner's pages (settings + blocks). Scope `pages:read`.
// Someone else's page and a missing page both answer 404.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await restAuth(request, 'pages:read')
  if (auth.response) return auth.response
  const { slug } = await params
  if (!SLUG_RE.test(slug)) return restError(404, 'not_found', 'Página no encontrada')
  try {
    const page = await ownerStore().getPage(auth.principal.userId, { slug })
    if (!page) return restError(404, 'not_found', 'Página no encontrada')
    return Response.json({
      data: { id: page.id, slug: page.slug, name: page.name, published: page.published, url: `${baseUrl()}/p/${page.slug}`, updated_at: page.updated_at, views: page.views, settings: page.settings, blocks: page.blocks },
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    console.error('GET /api/v1/pages/[slug] failed', e)
    return restError(500, 'internal', 'Error interno')
  }
}
