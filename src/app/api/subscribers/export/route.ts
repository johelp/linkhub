import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pageId = request.nextUrl.searchParams.get('pageId')
  if (!pageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 })

  const { data: page } = await supabase.from('pages').select('id, slug, user_id').eq('id', pageId).single()
  if (!page || page.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: subscribers, error } = await supabase
    .from('email_subscribers')
    .select('email, lang, created_at')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = [
    ['email', 'idioma', 'fecha'],
    ...(subscribers ?? []).map(s => [s.email, s.lang, s.created_at]),
  ]
  const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="suscriptores-${page.slug}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
