'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Globe, Check, Loader2, AlertCircle, Smartphone, Monitor, Tablet, Undo2, Redo2, ExternalLink } from 'lucide-react'
import { useEditorStore, selectSaveStatus } from '@/hooks/useEditorStore'
import type { Lang } from '@/types'

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const BORDER = 'rgba(26,27,28,0.08)'

const LANG_NAMES: Record<Lang, string> = { es: 'ES', en: 'EN', pt: 'PT', fr: 'FR', de: 'DE', it: 'IT' }

interface Props {
  onSaveNow: () => void
  onPublishClick: () => void
}

export function EditorTopBar({ onSaveNow, onPublishClick }: Props) {
  const page = useEditorStore(s => s.page)
  const status = useEditorStore(selectSaveStatus)
  const previewDevice = useEditorStore(s => s.previewDevice)
  const previewLang = useEditorStore(s => s.previewLang)
  const canUndo = useEditorStore(s => s.historyIndex > 0)
  const canRedo = useEditorStore(s => s.historyIndex < s.history.length - 1)
  const { setPreviewDevice, setPreviewLang, undo, redo, setName } = useEditorStore.getState()
  const [nameDraft, setNameDraft] = useState<string | null>(null)

  if (!page) return null
  const langs = page.settings.enabledLangs?.length ? page.settings.enabledLangs : [page.settings.defaultLang]

  function commitName() {
    const next = (nameDraft ?? '').trim()
    if (nameDraft !== null && next && next !== page!.name) setName(next.slice(0, 80))
    setNameDraft(null)
  }

  return (
    <header className="flex items-center gap-2 lg:gap-3 px-3 lg:px-5 h-16 bg-white flex-shrink-0 relative z-10"
      style={{ boxShadow: `0 1px 0 ${BORDER}` }}>

      <Link href="/dashboard" title="Volver a mis páginas" aria-label="Volver a mis páginas"
        className="flex items-center justify-center rounded-xl flex-shrink-0 hover:bg-[#F2F3F4]"
        style={{ width: 36, height: 36, color: MUTED }}>
        <ArrowLeft size={17} />
      </Link>

      {/* Editable name + live save status */}
      <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-[260px]">
        <input
          aria-label="Nombre de la página"
          value={nameDraft ?? page.name}
          onChange={e => setNameDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setNameDraft(null); e.currentTarget.blur() } }}
          className="text-[15px] font-semibold bg-transparent rounded-md px-1 -mx-1 truncate outline-none focus:bg-[#F6F6F5]"
          style={{ color: INK }} />
        <SaveStatus status={status} onRetry={onSaveNow} />
      </div>

      <div className="flex-1" />

      {/* Language of the fields being edited (only when the page has several) */}
      {langs.length > 1 && (
        <div className="hidden sm:flex items-center gap-0.5 p-1 rounded-xl flex-shrink-0" style={{ background: '#F2F3F4' }} role="group" aria-label="Idioma de edición">
          {langs.map(l => (
            <button key={l} onClick={() => setPreviewLang(l)} aria-pressed={previewLang === l}
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-bold"
              style={{ background: previewLang === l ? '#fff' : 'transparent', color: previewLang === l ? INK : LIGHT, boxShadow: previewLang === l ? '0 1px 4px rgba(26,27,28,0.14)' : 'none' }}>
              {LANG_NAMES[l]}
            </button>
          ))}
        </div>
      )}

      <div className="hidden lg:flex items-center gap-0.5 p-1 rounded-xl flex-shrink-0" style={{ background: '#F2F3F4' }} role="group" aria-label="Tamaño de la vista previa">
        {([
          { d: 'mobile' as const, icon: <Smartphone size={15} />, label: 'Móvil' },
          { d: 'tablet' as const, icon: <Tablet size={15} />, label: 'Tablet' },
          { d: 'desktop' as const, icon: <Monitor size={15} />, label: 'Escritorio' },
        ]).map(({ d, icon, label }) => (
          <button key={d} onClick={() => setPreviewDevice(d)} title={label} aria-label={label} aria-pressed={previewDevice === d}
            className="p-2 rounded-lg"
            style={{ background: previewDevice === d ? '#fff' : 'transparent', color: previewDevice === d ? INK : LIGHT, boxShadow: previewDevice === d ? '0 1px 4px rgba(26,27,28,0.14)' : 'none' }}>
            {icon}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        <IconBtn onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)"><Undo2 size={16} /></IconBtn>
        <IconBtn onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Shift+Z)"><Redo2 size={16} /></IconBtn>
      </div>

      {page.published && (
        <Link href={`/p/${page.slug}`} target="_blank" title="Abrir la página pública" aria-label="Abrir la página pública"
          className="hidden sm:flex items-center justify-center rounded-xl hover:bg-[#F2F3F4] flex-shrink-0" style={{ width: 36, height: 36, color: MUTED }}>
          <ExternalLink size={16} />
        </Link>
      )}

      <button onClick={onPublishClick}
        className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl flex-shrink-0 transition-colors"
        style={page.published
          ? { background: '#ECFDF3', color: '#15803D', border: '1.5px solid #BBF7D0' }
          : { background: INK, color: '#fff', boxShadow: '0 2px 10px rgba(26,27,28,0.25)' }}>
        <Globe size={14} />
        <span>{page.published ? 'En vivo' : 'Publicar'}</span>
      </button>
    </header>
  )
}

function SaveStatus({ status, onRetry }: { status: ReturnType<typeof selectSaveStatus>; onRetry: () => void }) {
  const base = 'flex items-center gap-1 text-[11px] font-medium'
  if (status === 'saving') return <span className={base} style={{ color: LIGHT }} role="status"><Loader2 size={11} className="animate-spin" /> Guardando…</span>
  if (status === 'dirty') return <span className={base} style={{ color: '#B45309' }} role="status">● Cambios sin guardar</span>
  if (status === 'error') return (
    <button onClick={onRetry} className={base + ' underline'} style={{ color: '#E8150A' }} role="status">
      <AlertCircle size={11} /> Error al guardar · Reintentar
    </button>
  )
  return <span className={base} style={{ color: LIGHT }} role="status"><Check size={11} /> Guardado</span>
}

function IconBtn({ onClick, disabled, title, children }: { onClick: () => void; disabled?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} aria-label={title}
      className="p-2 rounded-lg disabled:opacity-30 hover:bg-[#F2F3F4]" style={{ color: MUTED }}>
      {children}
    </button>
  )
}
