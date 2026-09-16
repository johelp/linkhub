'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Globe, GlobeLock, Save, Loader2, Smartphone, Monitor, Tablet, Undo2, Redo2 } from 'lucide-react'
import { useEditorStore } from '@/hooks/useEditorStore'
import type { Page } from '@/types'

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const BORDER = 'rgba(26,27,28,0.08)'

interface Props {
  page: Page
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  onPublish: () => void
}

export function EditorTopBar({ page, isDirty, isSaving, onSave, onPublish }: Props) {
  const { previewDevice, setPreviewDevice, undo, redo, canUndo, canRedo } = useEditorStore()

  return (
    <div className="flex items-center gap-3 lg:gap-4 px-3 lg:px-6 h-[68px] bg-white flex-shrink-0 overflow-x-auto relative z-10"
      style={{ boxShadow: '0 1px 0 rgba(26,27,28,0.08), 0 1px 6px rgba(26,27,28,0.03)' }}>

      {/* Back */}
      <Link href="/dashboard" title="Volver a Páginas"
        className="flex items-center justify-center rounded-xl flex-shrink-0 transition-colors"
        style={{ width: 36, height: 36, color: MUTED }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F2F3F4')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <ArrowLeft size={17} />
      </Link>

      <div className="w-px h-7 flex-shrink-0" style={{ background: BORDER }} />

      {/* Page name + status */}
      <div className="flex flex-col justify-center min-w-0 flex-shrink-0 max-w-[140px] sm:max-w-[220px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[15px] font-semibold truncate" style={{ color: INK }}>{page.name}</span>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#FF8C00' }} title="Cambios sin guardar" />}
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium" style={{ color: LIGHT }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: page.published ? '#16A34A' : '#C7C9CB' }} />
          {page.published ? 'En vivo' : 'Borrador · sin publicar'}
        </div>
      </div>

      <div className="flex-1" />

      {/* Toolbar cluster: undo/redo + device switcher, grouped as one unit */}
      <div className="hidden md:flex items-center gap-0.5 p-1 rounded-xl flex-shrink-0" style={{ background: '#F2F3F4' }}>
        <ToolbarIconButton onClick={undo} disabled={!canUndo()} title="Deshacer"><Undo2 size={15} /></ToolbarIconButton>
        <ToolbarIconButton onClick={redo} disabled={!canRedo()} title="Rehacer"><Redo2 size={15} /></ToolbarIconButton>

        <div className="hidden lg:block w-px h-5 mx-1 flex-shrink-0" style={{ background: 'rgba(26,27,28,0.1)' }} />

        <div className="hidden lg:flex gap-0.5">
          {[
            { d: 'mobile' as const, icon: <Smartphone size={14} />, label: 'Móvil' },
            { d: 'tablet' as const, icon: <Tablet size={14} />, label: 'Tablet' },
            { d: 'desktop' as const, icon: <Monitor size={14} />, label: 'Escritorio' },
          ].map(({ d, icon, label }) => (
            <button key={d} onClick={() => setPreviewDevice(d)} title={label}
              className="p-2 rounded-lg transition-all"
              style={{
                background: previewDevice === d ? '#fff' : 'transparent',
                color: previewDevice === d ? INK : LIGHT,
                boxShadow: previewDevice === d ? '0 1px 4px rgba(26,27,28,0.14)' : 'none',
              }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Undo/redo alone below md, where the toolbar cluster above is hidden */}
      <div className="flex md:hidden items-center gap-0.5 flex-shrink-0">
        <ToolbarIconButton onClick={undo} disabled={!canUndo()} title="Deshacer"><Undo2 size={15} /></ToolbarIconButton>
        <ToolbarIconButton onClick={redo} disabled={!canRedo()} title="Rehacer"><Redo2 size={15} /></ToolbarIconButton>
      </div>

      {/* View live */}
      {page.published && (
        <Link href={`/p/${page.slug}`} target="_blank"
          className="hidden sm:flex items-center text-[13px] font-semibold px-3.5 py-2.5 rounded-xl flex-shrink-0 transition-colors"
          style={{ color: MUTED }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F2F3F4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          Ver página →
        </Link>
      )}

      {/* Save */}
      <button onClick={onSave} disabled={!isDirty || isSaving}
        className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl disabled:opacity-40 transition-all flex-shrink-0"
        style={{ background: '#F2F3F4', color: INK }}
        onMouseEnter={e => { if (isDirty && !isSaving) e.currentTarget.style.background = '#E9EAEB' }}
        onMouseLeave={e => (e.currentTarget.style.background = '#F2F3F4')}>
        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        <span className="hidden sm:inline">Guardar</span>
      </button>

      {/* Publish — solid ink when the next step is to go live (the default
          call to action), ghost/outline red once live so "unpublish" reads
          as the occasional, slightly-destructive action instead of a twin
          of "publish" in a darker shade. */}
      {page.published ? (
        <button onClick={onPublish}
          className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-all flex-shrink-0"
          style={{ background: '#fff', color: '#E8150A', border: '1.5px solid #F6C6C3' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF0EF'; e.currentTarget.style.borderColor = '#E8150A' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#F6C6C3' }}>
          <GlobeLock size={14} />
          <span className="hidden sm:inline">Despublicar</span>
        </button>
      ) : (
        <button onClick={onPublish}
          className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl text-white transition-all flex-shrink-0"
          style={{ background: INK, boxShadow: '0 2px 10px rgba(26,27,28,0.25)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(26,27,28,0.32)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,27,28,0.25)' }}>
          <Globe size={14} />
          <span className="hidden sm:inline">Publicar</span>
        </button>
      )}
    </div>
  )
}

function ToolbarIconButton({ onClick, disabled, title, children }: {
  onClick: () => void
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className="p-2 rounded-lg disabled:opacity-30 transition-all"
      style={{
        color: MUTED,
        background: hover && !disabled ? '#fff' : 'transparent',
        boxShadow: hover && !disabled ? '0 1px 4px rgba(26,27,28,0.14)' : 'none',
      }}>
      {children}
    </button>
  )
}
