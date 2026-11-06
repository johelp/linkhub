import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ROADMAP } from '@/lib/roadmap'
import { RoadmapVotes } from './RoadmapVotes'

export const metadata: Metadata = { title: 'Próximamente | LinkHub' }

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  // If migration 020 isn't applied yet the query errors: show the list without votes.
  const { data } = await supabase.from('roadmap_votes' as never).select('item_key')
  const voted = ((data ?? []) as unknown as { item_key: string }[]).map(v => v.item_key)
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[760px] mx-auto">
      <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Próximamente</h1>
      <p className="text-sm text-[#5A5D60] mt-1 mb-6 max-w-2xl">Estamos estudiando estas funciones y construimos primero las que más os interesan. Vota las que te harían falta: es lo que decide el orden. No son promesas de fecha.</p>
      <RoadmapVotes items={ROADMAP} initialVoted={voted} />
      <p className="text-[13px] text-[#5A5D60] mt-6">¿Echas en falta algo que no está aquí? Escríbenos a <a href="mailto:hola@linkhub.johelpastorino.com" className="underline">hola@linkhub.johelpastorino.com</a>: leemos todo.</p>
    </div>
  )
}
