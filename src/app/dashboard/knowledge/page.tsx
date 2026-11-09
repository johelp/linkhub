import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { KnowledgeEntry } from '@/lib/knowledge'
import { KnowledgeManager } from './KnowledgeManager'

export const metadata: Metadata = { title: 'Conocimiento | LinkHub' }

export default async function KnowledgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const [{ data: entries }, { data: pages }] = await Promise.all([
    supabase.from('knowledge_entries').select('id, page_id, kind, title, content, visibility, position').order('position'),
    supabase.from('pages').select('id, name').eq('user_id', user.id).order('updated_at', { ascending: false }),
  ])
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[860px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Base de conocimiento</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-6 max-w-2xl">Todo lo que sabes de tu negocio, en un solo lugar: preguntas frecuentes, políticas, cómo llegar, qué incluye cada servicio… Lo marcado como <b>público</b> aparece en tu página y ayuda a que Google y los asistentes de IA respondan bien sobre ti. Lo <b>privado</b> solo lo usan tus propias integraciones.</p>
      <KnowledgeManager initial={(entries ?? []) as KnowledgeEntry[]} pages={pages ?? []} />
    </div>
  )
}
