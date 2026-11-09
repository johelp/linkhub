'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Search, Pencil, ExternalLink, Link2, QrCode } from 'lucide-react'
import { PageCardActions } from './PageCardActions'
import { NewPageButton } from './NewPageButton'
import type { Plan } from '@/types'

export interface PageRow {
  id: string; name: string; slug: string; published: boolean; color: string
  blocks: number; views30: number; clicks30: number; updated: string
}

type Filter = 'all' | 'live' | 'draft'

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

export function PagesGrid({ pages, canCreate, plan, showClicks, aiEnabled }: { pages: PageRow[]; canCreate: boolean; plan: Plan; showClicks: boolean; aiEnabled?: boolean }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const shown = useMemo(() => pages.filter(p =>
    (filter === 'all' || (filter === 'live') === p.published) &&
    (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()) || p.slug.includes(q.trim().toLowerCase()))
  ), [pages, q, filter])

  async function copy(slug: string) {
    const url = `${window.location.origin}/p/${slug}`
    try { await navigator.clipboard.writeText(url); toast.success('Enlace copiado') } catch { toast.error(url) }
  }

  return (
    <section aria-labelledby="pages-h">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 id="pages-h" className="text-[17px] font-bold text-[#1A1B1C] mr-auto">Tus páginas</h2>
        {pages.length > 3 && (
          <label className="relative">
            <span className="sr-only">Buscar página</span>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6E71]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar…" className="pl-8 pr-3 py-2 rounded-xl text-sm outline-none bg-white w-40 sm:w-52" style={{ border: '1.5px solid rgba(26,27,28,0.09)' }} />
          </label>
        )}
        <div className="flex p-1 rounded-xl bg-[#ECEDEE]" role="group" aria-label="Filtrar páginas">
          {([['all', 'Todas'], ['live', 'En vivo'], ['draft', 'Borradores']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k}
              className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: filter === k ? '#fff' : 'transparent', color: filter === k ? '#1A1B1C' : '#5B6064', boxShadow: filter === k ? '0 1px 3px rgba(26,27,28,.12)' : 'none' }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
        {shown.map(p => (
          <article key={p.id} className="bg-white rounded-2xl overflow-hidden transition-shadow hover:shadow-[0_8px_28px_rgba(26,27,28,0.08)]" style={{ border: '1px solid rgba(26,27,28,0.08)' }}>
            <div className="h-16 relative" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}88)` }}>
              <span className="absolute left-4 -bottom-5 w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold border-[3px] border-white" style={{ background: p.color }}>{(p.name[0] || '•').toUpperCase()}</span>
              <span className="absolute right-3 top-3 text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ background: p.published ? '#ECFDF3' : 'rgba(255,255,255,.85)', color: p.published ? '#15803D' : '#5A5D60' }}>
                {p.published ? '● En vivo' : '○ Borrador'}
              </span>
            </div>
            <div className="px-4 pt-8 pb-4">
              <h3 className="text-[15px] font-bold text-[#1A1B1C] truncate">{p.name}</h3>
              <p className="text-xs text-[#6B6E71] truncate">linkhub.app/p/{p.slug}</p>

              <dl className="grid grid-cols-3 gap-2 my-4 text-center">
                {[
                  ['Visitas 30d', fmt(p.views30)],
                  ['Clics 30d', showClicks ? fmt(p.clicks30) : '—'],
                  ['Bloques', String(p.blocks)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl py-2" style={{ background: '#F8F8F7' }}>
                    <dd className="text-[15px] font-bold text-[#1A1B1C] tabular-nums">{v}</dd>
                    <dt className="text-[10.5px] text-[#6B6E71] font-medium">{k}</dt>
                  </div>
                ))}
              </dl>

              <div className="flex items-center gap-1.5">
                <Link href={`/editor/${p.id}`} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-[13px] font-semibold no-underline" style={{ background: '#FEF0EF', color: '#C8110A' }}>
                  <Pencil size={13} /> Editar
                </Link>
                {p.published && (
                  <>
                    <button onClick={() => copy(p.slug)} title="Copiar enlace" aria-label={`Copiar enlace de ${p.name}`} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#EDEEEF]" style={{ background: '#F6F6F5', color: '#5A5D60' }}><Link2 size={15} /></button>
                    <Link href={`/p/${p.slug}`} target="_blank" title="Ver página" aria-label={`Ver ${p.name}`} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#EDEEEF]" style={{ background: '#F6F6F5', color: '#5A5D60' }}><ExternalLink size={15} /></Link>
                  </>
                )}
                <Link href={`/dashboard/qr/${p.id}`} title="Código QR" aria-label={`QR de ${p.name}`} className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center hover:bg-[#EDEEEF]" style={{ background: '#F6F6F5', color: '#5A5D60' }}><QrCode size={15} /></Link>
                <PageCardActions pageId={p.id} pageName={p.name} />
              </div>
            </div>
          </article>
        ))}
        {filter === 'all' && !q && canCreate && <NewPageButton canCreate plan={plan} aiEnabled={aiEnabled} asCard />}
      </div>

      {shown.length === 0 && (
        <p className="text-center text-sm text-[#6B6E71] py-10">Ninguna página coincide con ese filtro.</p>
      )}
    </section>
  )
}
