import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { csvCell, parseFilters } from '@/lib/payments/history'

// CSV of the seller's own payments (RLS already limits rows to their pages).
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const f = parseFilters(Object.fromEntries(request.nextUrl.searchParams))

  let q = supabase.from('payments')
    .select('id, created_at, status, provider, amount, currency, tier_name, payer_email, provider_payment_id, provider_preference_id, page_id, pages!inner(name, user_id)')
    .eq('pages.user_id', user.id).order('created_at', { ascending: false }).limit(5000)
  if (f.status) q = q.eq('status', f.status as 'approved' | 'pending' | 'rejected' | 'refunded')
  if (f.provider) q = q.eq('provider', f.provider)
  if (f.page) q = q.eq('page_id', f.page)
  if (f.from) q = q.gte('created_at', `${f.from}T00:00:00Z`)
  if (f.to) q = q.lte('created_at', `${f.to}T23:59:59Z`)
  if (f.q) q = q.or(`payer_email.ilike.%${f.q}%,provider_payment_id.ilike.%${f.q}%,tier_name.ilike.%${f.q}%`)
  const { data, error } = await q
  if (error) { console.error('payments export error', error); return NextResponse.json({ error: 'No se pudo exportar' }, { status: 500 }) }

  type Row = NonNullable<typeof data>[number] & { pages?: { name?: string } | { name?: string }[] }
  const rows = [['fecha', 'estado', 'pasarela', 'página', 'concepto', 'importe', 'moneda', 'comprador', 'id_pago', 'referencia', 'id_interno'],
    ...(data as Row[] ?? []).map(p => [p.created_at, p.status, p.provider, Array.isArray(p.pages) ? p.pages[0]?.name : p.pages?.name, p.tier_name ?? 'Pago', p.amount, p.currency, p.payer_email, p.provider_payment_id, p.provider_preference_id, p.id])]
  return new NextResponse('﻿' + rows.map(r => r.map(csvCell).join(',')).join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="cobros.csv"', 'Cache-Control': 'no-store' },
  })
}
