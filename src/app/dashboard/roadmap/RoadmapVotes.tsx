'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { ThumbsUp } from 'lucide-react'
import type { RoadmapItem } from '@/lib/roadmap'

export function RoadmapVotes({ items, initialVoted }: { items: RoadmapItem[]; initialVoted: string[] }) {
  const [voted, setVoted] = useState<Set<string>>(new Set(initialVoted))
  const [busy, setBusy] = useState<string | null>(null)

  async function toggle(key: string) {
    const next = !voted.has(key)
    setBusy(key)
    // Optimistic: flip now, undo if the server says no.
    setVoted(prev => { const s = new Set(prev); if (next) s.add(key); else s.delete(key); return s })
    try {
      const res = await fetch('/api/roadmap/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, voted: next }) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'No se pudo guardar tu voto.')
      if (next) toast.success('Gracias, lo tendremos en cuenta')
    } catch (e) {
      setVoted(prev => { const s = new Set(prev); if (next) s.delete(key); else s.add(key); return s })
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar tu voto.')
    } finally { setBusy(null) }
  }

  return (
    <ul className="grid gap-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map(it => {
        const on = voted.has(it.id)
        return (
          <li key={it.id} className="flex items-center gap-4 bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(26,27,28,0.08)' }}>
            <span className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-[#F6F6F4] shrink-0" aria-hidden>{it.icon}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-bold text-[#1A1B1C]">{it.title} <span className="ml-1 align-middle text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: '#F2F3F4', color: '#5A5D60' }}>En estudio</span></span>
              <span className="block text-[13px] text-[#5A5D60]">{it.text}</span>
            </span>
            <button type="button" onClick={() => toggle(it.id)} disabled={busy === it.id} aria-pressed={on}
              aria-label={`${on ? 'Quitar mi voto de' : 'Votar'}: ${it.title}`}
              className="inline-flex items-center gap-2 rounded-full px-4 text-[13px] font-semibold shrink-0 transition-colors"
              style={{ minHeight: 44, border: `1.5px solid ${on ? '#1A1B1C' : 'rgba(26,27,28,0.15)'}`, background: on ? '#1A1B1C' : '#fff', color: on ? '#fff' : '#1A1B1C', cursor: 'pointer' }}>
              <ThumbsUp size={15} aria-hidden /> {on ? 'Votado' : 'Lo quiero'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
