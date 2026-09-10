import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StampForm } from './StampForm'

export const metadata: Metadata = { title: 'Tarjeta de sellos | LinkHub' }

interface Props {
  params: Promise<{ pageId: string }>
}

export default async function LoyaltyPage({ params }: Props) {
  const { pageId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: page } = await supabase.from('pages').select('id, name').eq('id', pageId).eq('user_id', user.id).single()
  if (!page) notFound()

  const { count: cards } = await supabase
    .from('loyalty_cards').select('id', { count: 'exact', head: true }).eq('page_id', pageId)
  const { count: redeemed } = await supabase
    .from('loyalty_cards').select('id', { count: 'exact', head: true }).eq('page_id', pageId).not('last_redeemed_at', 'is', null)

  return (
    <div className="p-6 max-w-lg">
      <Link href="/dashboard" className="text-sm" style={{ color: '#9A9D9F' }}>← Dashboard</Link>
      <h1 className="text-2xl font-bold mt-4 mb-2" style={{ color: '#1A1B1C' }}>Tarjeta de sellos</h1>
      <p className="text-sm mb-6" style={{ color: '#9A9D9F' }}>{page.name}</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(26,27,28,0.09)' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1A1B1C' }}>{cards ?? 0}</p>
          <p style={{ fontSize: 12, color: '#9A9D9F' }}>Tarjetas activas</p>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(26,27,28,0.09)' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1A1B1C' }}>{redeemed ?? 0}</p>
          <p style={{ fontSize: 12, color: '#9A9D9F' }}>Premios canjeados</p>
        </div>
      </div>

      <StampForm pageId={pageId} />
    </div>
  )
}
