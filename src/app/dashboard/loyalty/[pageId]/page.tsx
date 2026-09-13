import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StampForm } from './StampForm'
import type { Page, LoyaltyCardBlock } from '@/types'

export const metadata: Metadata = { title: 'Tarjeta de sellos | LinkHub' }

interface Props {
  params: Promise<{ pageId: string }>
}

// How many of the page's most recent cardholders to list -- this is a
// simple owner dashboard, not a paginated CRM; if a page ever has more
// than this many stamp-card customers, revisit with real pagination.
const CUSTOMER_LIST_LIMIT = 200

export default async function LoyaltyPage({ params }: Props) {
  const { pageId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: page } = await supabase.from('pages').select('id, name, blocks').eq('id', pageId).eq('user_id', user.id).single()
  if (!page) notFound()

  const loyaltyBlocks = ((page.blocks as unknown as Page['blocks']) || []).filter(
    (b): b is LoyaltyCardBlock => b.type === 'loyalty_card'
  )
  const targetStampsByBlock = new Map(loyaltyBlocks.map(b => [b.id, b.data.targetStamps]))

  const { count: cards, error: cardsError } = await supabase
    .from('loyalty_cards').select('id', { count: 'exact', head: true }).eq('page_id', pageId)
  const { count: redeemed } = await supabase
    .from('loyalty_cards').select('id', { count: 'exact', head: true }).eq('page_id', pageId).not('last_redeemed_at', 'is', null)

  // The customer-facing list this dashboard exists for: every stamp card a
  // visitor has claimed on this page, so the owner can see who's holding one
  // instead of only aggregate counts.
  const { data: customers } = await supabase
    .from('loyalty_cards')
    .select('code, block_id, stamps_count, last_redeemed_at, created_at')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false })
    .limit(CUSTOMER_LIST_LIMIT)

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/dashboard" className="text-sm" style={{ color: '#9A9D9F' }}>← Dashboard</Link>
      <h1 className="text-2xl font-bold mt-4 mb-2" style={{ color: '#1A1B1C' }}>Tarjeta de sellos</h1>
      <p className="text-sm mb-6" style={{ color: '#9A9D9F' }}>{page.name}</p>

      {/* A query error here (as opposed to a real 0) almost always means the
          `loyalty_cards` table/migration 009 hasn't been applied to this
          Supabase project yet -- distinct from "no hay tarjetas todavía". */}
      {cardsError && (
        <div style={{ background: '#FEF0EF', border: '1px solid rgba(232,21,10,0.25)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 12.5, color: '#1A1B1C', lineHeight: 1.5 }}>
            No pudimos cargar las tarjetas de sellos ({cardsError.message}). Si esto persiste, confirmá que la migración
            de Supabase <code>009_loyalty_cards.sql</code> ya se ejecutó en este proyecto.
          </p>
        </div>
      )}

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

      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A1B1C', marginTop: 32, marginBottom: 12 }}>
        Clientes con tarjeta {customers && customers.length > 0 && <span style={{ color: '#9A9D9F', fontWeight: 500 }}>({customers.length}{customers.length === CUSTOMER_LIST_LIMIT ? '+' : ''})</span>}
      </h2>

      {!customers || customers.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9A9D9F' }}>
          {cardsError ? 'No pudimos cargar la lista.' : 'Todavía nadie sacó una tarjeta de sellos en esta página.'}
        </p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(26,27,28,0.09)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F6F6F5' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', color: '#9A9D9F', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase' }}>Código</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', color: '#9A9D9F', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase' }}>Sellos</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', color: '#9A9D9F', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', color: '#9A9D9F', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase' }}>Desde</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => {
                const target = targetStampsByBlock.get(c.block_id) ?? 10
                const earned = c.stamps_count >= target
                return (
                  <tr key={c.code} style={{ borderTop: '1px solid rgba(26,27,28,0.06)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <a href={`/l/${c.code}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: 'monospace', color: '#1A1B1C', textDecoration: 'none' }}>
                        {c.code}
                      </a>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#1A1B1C', fontWeight: 600 }}>{c.stamps_count} / {target}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {c.last_redeemed_at ? (
                        <span style={{ color: '#9A9D9F' }}>Canjeada</span>
                      ) : earned ? (
                        <span style={{ color: '#16A34A', fontWeight: 600 }}>Lista para canjear</span>
                      ) : (
                        <span style={{ color: '#5A5D60' }}>Activa</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#9A9D9F' }}>
                      {new Date(c.created_at).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
