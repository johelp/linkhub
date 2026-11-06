import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Download, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Contactos | LinkHub' }

interface Props { searchParams: Promise<{ page?: string; q?: string }> }

const card = { border: '1px solid rgba(26,27,28,0.08)' }
const LIMIT = 200

export default async function ContactsPage({ searchParams }: Props) {
  const { page: pageParam, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: pages } = await supabase.from('pages').select('id, name').eq('user_id', user.id).order('updated_at', { ascending: false })
  const list = pages ?? []
  const selected = list.find(p => p.id === pageParam)
  const ids = selected ? [selected.id] : list.map(p => p.id)
  const names = new Map(list.map(p => [p.id, p.name]))
  // Strip LIKE wildcards so a search can't turn into a pattern scan.
  const term = (q ?? '').trim().slice(0, 60).replace(/[%_,()]/g, '')

  let subs: { id: string; email: string; lang: string | null; page_id: string; created_at: string }[] = []
  let total = 0
  if (ids.length) {
    let query = supabase.from('email_subscribers').select('id, email, lang, page_id, created_at', { count: 'exact' }).in('page_id', ids)
    if (term) query = query.ilike('email', `%${term}%`)
    const res = await query.order('created_at', { ascending: false }).limit(LIMIT)
    subs = res.data ?? []
    total = res.count ?? subs.length
  }

  const href = (id?: string) => `/dashboard/contacts${id ? `?page=${id}` : ''}`
  const pill = (on: boolean): React.CSSProperties => ({ background: on ? '#1A1B1C' : '#fff', color: on ? '#fff' : '#5A5D60', border: '1px solid rgba(26,27,28,0.09)' })

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1000px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[24px] lg:text-[28px] font-bold tracking-tight text-[#1A1B1C]">Contactos</h1>
          <p className="text-sm text-[#7A7D80] mt-1">Emails que dejaron tus visitantes en el bloque de captura.</p>
        </div>
        {selected && total > 0 && (
          <a href={`/api/subscribers/export?pageId=${selected.id}`} className="flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold no-underline text-white" style={{ background: '#1A1B1C' }}><Download size={14} />Exportar CSV</a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 mr-auto">
          <Link href={href()} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold no-underline whitespace-nowrap" style={pill(!selected)}>Todas</Link>
          {list.map(p => <Link key={p.id} href={href(p.id)} className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold no-underline whitespace-nowrap max-w-[180px] truncate" style={pill(p.id === selected?.id)}>{p.name}</Link>)}
        </div>
        <form action="/dashboard/contacts" className="flex gap-2">
          {selected && <input type="hidden" name="page" value={selected.id} />}
          <input name="q" defaultValue={term} placeholder="Buscar email…" aria-label="Buscar email" className="px-3.5 py-2 rounded-xl text-sm outline-none bg-white w-44 sm:w-56" style={{ border: '1.5px solid rgba(26,27,28,0.09)' }} />
        </form>
      </div>

      {subs.length === 0 ? (
        <div className="bg-white rounded-2xl px-6 py-14 text-center" style={card}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#FEF0EF', color: '#E8150A' }}><Mail size={22} /></div>
          <h2 className="text-lg font-bold text-[#1A1B1C] mb-1">{term ? 'Sin resultados' : 'Todavía no hay contactos'}</h2>
          <p className="text-sm text-[#7A7D80] max-w-sm mx-auto">{term ? 'Probá con otra búsqueda.' : 'Agregá el bloque “Captura de email” a tu página y los emails aparecen acá. Los pedidos y turnos llegan directo a tu WhatsApp.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={card}>
          <p className="px-5 py-3 text-xs text-[#6B6E71] border-b" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>{total} {total === 1 ? 'contacto' : 'contactos'}{total > LIMIT ? ` · mostrando los ${LIMIT} más recientes` : ''}</p>
          <ul>
            {subs.map(s => (
              <li key={s.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0" style={{ borderColor: 'rgba(26,27,28,0.06)' }}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#F2F3F4', color: '#5A5D60' }}>{s.email[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <a href={`mailto:${s.email}`} className="block text-[13.5px] font-medium text-[#1A1B1C] truncate no-underline hover:underline">{s.email}</a>
                  <p className="text-xs text-[#6B6E71] truncate">{names.get(s.page_id) ?? 'Página'} · {(s.lang ?? 'es').toUpperCase()}</p>
                </div>
                <span className="text-xs text-[#6B6E71] flex-shrink-0">{formatDate(s.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
