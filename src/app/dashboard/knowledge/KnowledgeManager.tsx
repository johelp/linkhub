'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Globe, Lock, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { KIND_LABEL, MAX_CONTENT, MAX_TITLE, type KnowledgeEntry, type KnowledgeKind, type KnowledgeVisibility } from '@/lib/knowledge'

interface Draft { id?: string; title: string; content: string; kind: KnowledgeKind; visibility: KnowledgeVisibility; page_id: string }
const EMPTY: Draft = { title: '', content: '', kind: 'faq', visibility: 'public', page_id: '' }
const card = { border: '1px solid rgba(26,27,28,0.08)' }
const field = 'w-full px-3.5 py-2.5 rounded-xl text-[15px] bg-white outline-none'
const ring = { border: '1.5px solid rgba(26,27,28,0.14)' }

export function KnowledgeManager({ initial, pages }: { initial: KnowledgeEntry[]; pages: { id: string; name: string }[] }) {
  const router = useRouter()
  const [entries, setEntries] = useState(initial)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const pageName = new Map(pages.map(p => [p.id, p.name]))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return
    setBusy(true)
    const body = { title: draft.title, content: draft.content, kind: draft.kind, visibility: draft.visibility, page_id: draft.page_id || null }
    const res = await fetch(draft.id ? `/api/knowledge/${draft.id}` : '/api/knowledge', { method: draft.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { toast.error(data.error ?? 'No se pudo guardar'); return }
    toast.success(draft.id ? 'Guardado' : 'Añadido')
    setDraft(null); router.refresh()
    if (draft.id) setEntries(es => es.map(x => x.id === draft.id ? { ...x, ...body, page_id: body.page_id } : x))
    else if (data.entry) setEntries(es => [...es, data.entry])
  }

  async function remove(id: string) {
    if (!window.confirm('¿Eliminar esta entrada?')) return
    const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('No se pudo eliminar'); return }
    setEntries(es => es.filter(x => x.id !== id)); toast.success('Eliminada'); router.refresh()
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= entries.length) return
    const next = [...entries]; [next[i], next[j]] = [next[j], next[i]]
    setEntries(next)
    await Promise.all([fetch(`/api/knowledge/${next[i].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: i }) }),
      fetch(`/api/knowledge/${next[j].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: j }) })])
    router.refresh()
  }

  return (
    <div>
      {!draft && <button onClick={() => setDraft({ ...EMPTY })} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[14px] font-semibold text-white mb-5" style={{ background: '#1A1B1C' }}><Plus size={16} />Añadir entrada</button>}

      {draft && (
        <form onSubmit={save} className="bg-white rounded-2xl p-5 mb-6 space-y-4" style={card} aria-label={draft.id ? 'Editar entrada' : 'Nueva entrada'}>
          <label className="block"><span className="block text-[13px] font-semibold mb-1.5">{draft.kind === 'faq' ? 'Pregunta' : 'Título'}</span>
            <input className={field} style={ring} required maxLength={MAX_TITLE} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder={draft.kind === 'faq' ? '¿Cómo puedo pagar?' : 'Política de cancelación'} /></label>
          <label className="block"><span className="block text-[13px] font-semibold mb-1.5">{draft.kind === 'faq' ? 'Respuesta' : 'Contenido'}</span>
            <textarea className={field} style={ring} required rows={5} maxLength={MAX_CONTENT} value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })} />
            <span className="block text-xs text-[#6B6E71] mt-1">{draft.content.length}/{MAX_CONTENT}</span></label>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Tipo</span>
              <select className={field} style={ring} value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as KnowledgeKind })}>{(Object.keys(KIND_LABEL) as KnowledgeKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></label>
            <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Visibilidad</span>
              <select className={field} style={ring} value={draft.visibility} onChange={e => setDraft({ ...draft, visibility: e.target.value as KnowledgeVisibility })}><option value="public">Pública (aparece en tu página)</option><option value="private">Privada (solo tus integraciones)</option></select></label>
            <label className="block"><span className="block text-[13px] font-semibold mb-1.5">Dónde</span>
              <select className={field} style={ring} value={draft.page_id} onChange={e => setDraft({ ...draft, page_id: e.target.value })}><option value="">Todas mis páginas</option>{pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          </div>
          <div className="flex gap-2">
            <button disabled={busy} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[14px] font-semibold text-white disabled:opacity-60" style={{ background: '#E8150A' }}>{busy && <Loader2 size={15} className="animate-spin" />}Guardar</button>
            <button type="button" onClick={() => setDraft(null)} className="h-11 px-5 rounded-xl text-[14px] font-semibold" style={{ background: '#F2F3F4' }}>Cancelar</button>
          </div>
        </form>
      )}

      {entries.length === 0 && !draft ? (
        <div className="bg-white rounded-2xl px-6 py-12 text-center" style={card}>
          <h2 className="text-[17px] font-bold mb-1">Empieza con 3 preguntas</h2>
          <p className="text-sm text-[#5A5D60] max-w-md mx-auto">Piensa en lo que más te preguntan los clientes: precios, horarios, cómo reservar, formas de pago. Cada respuesta que añadas mejora tu página y cómo te describen Google y los asistentes de IA.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((e, i) => (
            <li key={e.id} className="bg-white rounded-2xl p-4 sm:p-5" style={card}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-[#1A1B1C]">{e.title}</p>
                  <p className="text-[13.5px] text-[#3F4346] mt-1 line-clamp-3 whitespace-pre-line">{e.content}</p>
                  <p className="mt-2.5 flex flex-wrap items-center gap-2 text-[11.5px] font-semibold">
                    <span className="px-2 py-0.5 rounded-full" style={{ background: '#F2F3F4', color: '#3F4346' }}>{KIND_LABEL[e.kind]}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: e.visibility === 'public' ? '#ECFDF3' : '#F2F3F4', color: e.visibility === 'public' ? '#15803D' : '#3F4346' }}>{e.visibility === 'public' ? <Globe size={11} /> : <Lock size={11} />}{e.visibility === 'public' ? 'Pública' : 'Privada'}</span>
                    <span className="text-[#6B6E71]">{e.page_id ? pageName.get(e.page_id) ?? 'Una página' : 'Todas las páginas'}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <div className="flex gap-1">
                    <IconBtn label="Subir" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={15} /></IconBtn>
                    <IconBtn label="Bajar" onClick={() => move(i, 1)} disabled={i === entries.length - 1}><ArrowDown size={15} /></IconBtn>
                  </div>
                  <div className="flex gap-1">
                    <IconBtn label="Editar" onClick={() => setDraft({ id: e.id, title: e.title, content: e.content, kind: e.kind, visibility: e.visibility, page_id: e.page_id ?? '' })}><Pencil size={15} /></IconBtn>
                    <IconBtn label="Eliminar" onClick={() => remove(e.id)} danger><Trash2 size={15} /></IconBtn>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-[#6B6E71] mt-6">Para mostrar tus preguntas públicas en la página, añade el bloque <b>Preguntas frecuentes</b> desde el editor.</p>
    </div>
  )
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F2F3F4] disabled:opacity-30" style={{ color: danger ? '#B91C1C' : '#3F4346' }}>{children}</button>
}
