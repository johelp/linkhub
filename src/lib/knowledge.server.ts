import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { publicEntriesForPage, type KnowledgeEntry } from '@/lib/knowledge'

// Public knowledge for one page (own + account-wide). Service role: visitors
// have no policy on the table; only entries marked public ever leave here.
// Before migration 019 the table is missing -> an empty list, never an error.
export async function getPublicKnowledge(userId: string, pageId: string): Promise<KnowledgeEntry[]> {
  try {
    const { data, error } = await createAdminClient().from('knowledge_entries').select('id, page_id, kind, title, content, visibility, position').eq('user_id', userId).eq('visibility', 'public').order('position')
    if (error || !data) return []
    return publicEntriesForPage(data as KnowledgeEntry[], pageId)
  } catch { return [] }
}

// Public FAQs are rendered into cached pages: refresh them right away.
export async function refreshPublicPages(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: pages } = await supabase.from('pages').select('slug').eq('user_id', userId)
  for (const p of pages ?? []) revalidatePath(`/p/${p.slug}`)
}
