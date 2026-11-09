import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Page } from '@/types'
import { EditorShell } from './EditorShell'
import { getConnections } from '@/lib/payments'
import { getFlagsForUser } from '@/lib/flags.server'
import { hiddenBlockTypes } from '@/lib/flags'
import { publicEntriesForPage, type KnowledgeEntry } from '@/lib/knowledge'
import type { PaymentProvider } from '@/types'

export const metadata: Metadata = { title: 'Editor | LinkHub' }

interface Props {
  params: Promise<{ pageId: string }>
}

export default async function EditorPage({ params }: Props) {
  const { pageId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: page }, { data: profile }] = await Promise.all([
    supabase.from('pages').select('*').eq('id', pageId).eq('user_id', user.id).single(),
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
  ])

  if (!page) notFound()
  const hiddenBlocks = hiddenBlockTypes(await getFlagsForUser(user.id, user.email))
  const { data: kb } = await supabase.from('knowledge_entries').select('id, page_id, kind, title, content, visibility, position').order('position')
  const knowledge = publicEntriesForPage((kb ?? []) as KnowledgeEntry[], pageId)
  const connected = (await getConnections(user.id)).map(c => c.provider as PaymentProvider)

  return (
    <EditorShell
      page={page as unknown as Page}
      plan={profile?.plan || 'free'}
      connectedProviders={connected}
      hiddenBlocks={hiddenBlocks}
      knowledge={knowledge}
    />
  )
}
