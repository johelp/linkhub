import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Page, LoyaltyCardBlock } from '@/types'

export const metadata: Metadata = { title: 'Tu tarjeta de sellos | LinkHub' }

interface Props {
  params: Promise<{ code: string }>
}

// Public page: whoever holds the (high-entropy, unguessable) code can view
// this card -- same trust model as an unlisted link, same as /t/[code].
// Looked up with the admin client because `loyalty_cards` intentionally has
// no RLS select policy for anon; this route only ever queries a single exact
// code from the URL.
export default async function LoyaltyCardPage({ params }: Props) {
  const { code } = await params
  const admin = createAdminClient()

  const { data: card } = await admin
    .from('loyalty_cards')
    .select('code, page_id, block_id, stamps_count, last_redeemed_at')
    .eq('code', code)
    .single()
  if (!card) notFound()

  const { data: pageRow } = await admin.from('pages').select('name, blocks').eq('id', card.page_id).single()
  const block = (pageRow?.blocks as unknown as Page['blocks'] | undefined)
    ?.find(b => b.id === card.block_id && b.type === 'loyalty_card') as LoyaltyCardBlock | undefined

  const targetStamps = block?.data.targetStamps ?? 10
  const stampIcon = block?.data.stampIcon || '☕'
  const rewardDescription = block?.data.rewardDescription.es || block?.data.rewardDescription.en || 'un premio'
  const earned = card.stamps_count >= targetStamps

  const qrSvg = await QRCode.toString(card.code, {
    type: 'svg', margin: 2, color: { dark: '#1A1B1C', light: '#FFFFFF' }, errorCorrectionLevel: 'M', width: 220,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F6F6F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 20, padding: 28, textAlign: 'center', border: '1px solid rgba(26,27,28,0.09)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: '#9A9D9F', marginBottom: 8 }}>
          {pageRow?.name || 'Tarjeta de sellos'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, margin: '16px 0 20px' }}>
          {Array.from({ length: targetStamps }).map((_, i) => (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, background: i < card.stamps_count ? '#FEF0EF' : '#F6F6F5',
              border: `1.5px dashed ${i < card.stamps_count ? 'transparent' : 'rgba(26,27,28,0.15)'}`,
            }}>
              {i < card.stamps_count ? stampIcon : ''}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1B1C', marginBottom: 4 }}>
          {card.stamps_count} / {targetStamps} sellos
        </p>

        {earned ? (
          <p style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', marginBottom: 16 }}>
            🎉 ¡Ganaste tu premio! Mostrá esta pantalla: {rewardDescription}
          </p>
        ) : (
          <p style={{ fontSize: 13, color: '#5A5D60', marginBottom: 16 }}>
            Te faltan {targetStamps - card.stamps_count} sellos para {rewardDescription}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}
          dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <p style={{ fontSize: 11, color: '#9A9D9F' }}>Mostrá este código para que te sumen un sello.</p>

        <p style={{ fontSize: 11, color: '#9A9D9F', marginTop: 16, fontFamily: 'monospace' }}>{card.code}</p>
      </div>
    </div>
  )
}
