import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ValidateForm } from './ValidateForm'

export const metadata: Metadata = { title: 'Validar entradas | LinkHub' }

interface Props {
  params: Promise<{ pageId: string }>
}

export default async function ValidatePage({ params }: Props) {
  const { pageId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: page } = await supabase.from('pages').select('id, name').eq('id', pageId).eq('user_id', user.id).single()
  if (!page) notFound()

  const { count: issued } = await supabase
    .from('tickets').select('id', { count: 'exact', head: true }).eq('page_id', pageId).eq('status', 'issued')
  const { count: used } = await supabase
    .from('tickets').select('id', { count: 'exact', head: true }).eq('page_id', pageId).eq('status', 'used')

  return (
    <div className="p-6 max-w-lg">
      <Link href="/dashboard" className="text-sm" style={{ color: '#9A9D9F' }}>← Dashboard</Link>
      <h1 className="text-2xl font-bold mt-4 mb-2" style={{ color: '#1A1B1C' }}>Validar entradas</h1>
      <p className="text-sm mb-6" style={{ color: '#9A9D9F' }}>{page.name}</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(26,27,28,0.09)' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1A1B1C' }}>{used ?? 0}</p>
          <p style={{ fontSize: 12, color: '#9A9D9F' }}>Ingresaron</p>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(26,27,28,0.09)' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1A1B1C' }}>{issued ?? 0}</p>
          <p style={{ fontSize: 12, color: '#9A9D9F' }}>Pendientes</p>
        </div>
      </div>

      <ValidateForm pageId={pageId} />
    </div>
  )
}
