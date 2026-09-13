import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Tu entrada | LinkHub' }

interface Props {
  params: Promise<{ code: string }>
}

// Public page: whoever holds the (high-entropy, unguessable) code can view
// this ticket -- same trust model as an unlisted link. Looked up with the
// admin client because `tickets` intentionally has no RLS select policy for
// anon (that would let anyone list every ticket with no filter at all); this
// route only ever queries a single exact code from the URL.
export default async function TicketPage({ params }: Props) {
  const { code } = await params
  const admin = createAdminClient()

  const { data: ticket } = await admin
    .from('tickets')
    .select('tier_name, status, code, page_id')
    .eq('code', code)
    .single()
  if (!ticket) notFound()

  const { data: page } = await admin.from('pages').select('name').eq('id', ticket.page_id).single()

  const qrSvg = await QRCode.toString(ticket.code, {
    type: 'svg', margin: 2, color: { dark: '#1A1B1C', light: '#FFFFFF' }, errorCorrectionLevel: 'M', width: 260,
  })

  const used = ticket.status === 'used'

  return (
    <div style={{ minHeight: '100vh', background: '#F6F6F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 20, padding: 28, textAlign: 'center', border: '1px solid rgba(26,27,28,0.09)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: '#9A9D9F', marginBottom: 8 }}>
          {page?.name || 'Entrada'}
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1B1C', marginBottom: 20 }}>{ticket.tier_name}</h1>

        <div
          style={{ opacity: used ? 0.25 : 1, display: 'flex', justifyContent: 'center', marginBottom: 16 }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />

        {used ? (
          <p style={{ fontSize: 13, fontWeight: 700, color: '#9A9D9F' }}>Esta entrada ya fue utilizada.</p>
        ) : (
          <p style={{ fontSize: 13, color: '#5A5D60' }}>Presentá este código en la entrada del evento.</p>
        )}

        <p style={{ fontSize: 11, color: '#9A9D9F', marginTop: 16, fontFamily: 'monospace' }}>{ticket.code}</p>
      </div>
    </div>
  )
}
