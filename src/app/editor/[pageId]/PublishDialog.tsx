'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEditorStore } from '@/hooks/useEditorStore'
import { findBlockIssues } from '@/lib/blocks/summary'

interface Props {
  open: boolean
  onClose: () => void
  onSetPublished: (published: boolean) => Promise<boolean>
}

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const BORDER = 'rgba(26,27,28,0.09)'

// One place for "go live" / "take offline": shows what's still unfinished
// (placeholder links, empty media) before the page becomes public.
export function PublishDialog({ open, onClose, onSetPublished }: Props) {
  const page = useEditorStore(s => s.page)
  const lang = useEditorStore(s => s.previewLang)
  const selectBlock = useEditorStore(s => s.selectBlock)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !page) return null

  const issues = findBlockIssues(page.blocks, lang, useEditorStore.getState().connectedProviders)
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${page.slug}`
  const live = page.published

  async function run(next: boolean) {
    setBusy(true)
    const ok = await onSetPublished(next)
    setBusy(false)
    if (ok) {
      toast.success(next ? '¡Tu página ya está en vivo!' : 'Página despublicada')
      if (!next) onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4" style={{ background: 'rgba(26,27,28,0.55)' }}
      onClick={onClose} role="dialog" aria-modal="true" aria-label={live ? 'Tu página' : 'Publicar página'}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6" style={{ boxShadow: '0 24px 60px rgba(26,27,28,0.25)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold" style={{ color: INK }}>{live ? 'Tu página está en vivo' : 'Publicar tu página'}</h3>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              {live ? 'Los cambios se publican al instante cada vez que se guardan.' : 'Cualquiera con el enlace podrá verla.'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg" style={{ color: '#6B6E71' }}><X size={18} /></button>
        </div>

        {issues.length > 0 ? (
          <div className="rounded-xl p-3.5 mb-4" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <p className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: '#9A3412' }}>
              <AlertTriangle size={15} /> {issues.length} {issues.length === 1 ? 'cosa por completar' : 'cosas por completar'}
            </p>
            <ul className="space-y-1">
              {issues.slice(0, 6).map(i => (
                <li key={i.blockId + i.message}>
                  <button className="text-[13px] text-left underline-offset-2 hover:underline" style={{ color: '#9A3412' }}
                    onClick={() => { selectBlock(i.blockId); onClose() }}>
                    {i.message} →
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm flex items-center gap-2 mb-4" style={{ color: '#15803D' }}>
            <CheckCircle2 size={16} /> Todo listo: no hay enlaces vacíos.
          </p>
        )}

        {live && (
          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl" style={{ background: '#F6F6F5', border: `1px solid ${BORDER}` }}>
            <span className="flex-1 truncate text-[13px]" style={{ color: INK }}>{url}</span>
            <button className="p-1.5 rounded-lg" title="Copiar enlace" style={{ color: MUTED }}
              onClick={() => { void navigator.clipboard?.writeText(url).then(() => toast.success('Enlace copiado')) }}>
              <Copy size={15} />
            </button>
            <a className="p-1.5 rounded-lg" title="Abrir" href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: MUTED }}>
              <ExternalLink size={15} />
            </a>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          {live ? (
            <button disabled={busy} onClick={() => run(false)}
              className="px-4 py-2.5 rounded-xl text-[13px] font-semibold" style={{ color: '#C8110A', border: '1.5px solid #F6C6C3', background: '#fff' }}>
              Despublicar
            </button>
          ) : (
            <button disabled={busy} onClick={() => run(true)}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: INK }}>
              {busy && <Loader2 size={14} className="animate-spin" />}
              {issues.length ? 'Publicar igualmente' : 'Publicar ahora'}
            </button>
          )}
          {live && (
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{ background: INK }}>Listo</button>
          )}
        </div>
      </div>
    </div>
  )
}
