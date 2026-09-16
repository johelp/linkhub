'use client'
import Link from 'next/link'
import { ArrowLeft, Globe, GlobeLock, Save, Loader2, Smartphone, Monitor, Tablet, Undo2, Redo2 } from 'lucide-react'
import { useEditorStore } from '@/hooks/useEditorStore'
import type { Page } from '@/types'

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
    <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-5 py-3 bg-white border-b flex-shrink-0 overflow-x-auto"
      style={{borderColor:'rgba(26,27,28,0.09)'}}>

      {/* Back */}
      <Link href="/dashboard" className="flex items-center gap-1.5 text-sm mr-1 lg:mr-2 flex-shrink-0 px-1.5 py-1 rounded-lg transition-colors hover:bg-gray-50"
        style={{color:'#9A9D9F'}}>
        <ArrowLeft size={14}/> <span className="hidden sm:inline">Páginas</span>
      </Link>

      {/* Page name */}
      <div className="text-[15px] font-semibold truncate max-w-[120px] sm:max-w-[180px] flex-shrink-0" style={{color:'#1A1B1C'}}>
        {page.name}
      </div>

      {/* Dirty indicator */}
      {isDirty && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:'#FF8C00'}} title="Cambios sin guardar"/>}

      <div className="flex-1"/>

      {/* Undo/Redo */}
      <button onClick={undo} disabled={!canUndo()} title="Deshacer"
        className="p-2 rounded-lg disabled:opacity-30 transition-colors hover:bg-gray-50 flex-shrink-0"
        style={{color:'#5A5D60'}}>
        <Undo2 size={16}/>
      </button>
      <button onClick={redo} disabled={!canRedo()} title="Rehacer"
        className="p-2 rounded-lg disabled:opacity-30 transition-colors hover:bg-gray-50 flex-shrink-0"
        style={{color:'#5A5D60'}}>
        <Redo2 size={16}/>
      </button>

      {/* Device preview toggle — only meaningful with room to spare; on a real
          small screen you're already looking at the mobile viewport. */}
      <div className="hidden lg:flex gap-0.5 p-1 rounded-lg flex-shrink-0" style={{background:'#F2F3F4'}}>
        {[
          { d: 'mobile' as const, icon: <Smartphone size={14}/>, label: 'Móvil' },
          { d: 'tablet' as const, icon: <Tablet size={14}/>, label: 'Tablet' },
          { d: 'desktop' as const, icon: <Monitor size={14}/>, label: 'Escritorio' },
        ].map(({ d, icon, label }) => (
          <button key={d} onClick={() => setPreviewDevice(d)} title={label}
            className="p-2 rounded-md transition-all"
            style={{
              background: previewDevice === d ? '#fff' : 'transparent',
              color: previewDevice === d ? '#1A1B1C' : '#9A9D9F',
              boxShadow: previewDevice === d ? '0 1px 4px rgba(26,27,28,0.14)' : 'none',
            }}>
            {icon}
          </button>
        ))}
      </div>

      {/* View live */}
      {page.published && (
        <Link href={`/p/${page.slug}`} target="_blank"
          className="hidden sm:flex items-center text-[13px] font-medium px-4 py-2.5 rounded-lg flex-shrink-0 transition-colors"
          style={{background:'#F2F3F4',color:'#5A5D60'}}
          onMouseEnter={e => (e.currentTarget.style.background = '#E9EAEB')}
          onMouseLeave={e => (e.currentTarget.style.background = '#F2F3F4')}>
          Ver página →
        </Link>
      )}

      {/* Save */}
      <button onClick={onSave} disabled={!isDirty || isSaving}
        className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-lg disabled:opacity-40 transition-all flex-shrink-0"
        style={{background:'#F2F3F4',color:'#1A1B1C'}}
        onMouseEnter={e => { if (isDirty && !isSaving) e.currentTarget.style.background = '#E9EAEB' }}
        onMouseLeave={e => (e.currentTarget.style.background = '#F2F3F4')}>
        {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
        <span className="hidden sm:inline">Guardar</span>
      </button>

      {/* Publish — the one primary action in this bar, the only button that
          carries real weight (color + shadow) on purpose so it reads as
          the default next step, not one flat pill among several. */}
      <button onClick={onPublish}
        className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-lg text-white transition-all flex-shrink-0"
        style={{background: page.published ? '#B50F07' : '#E8150A', boxShadow: '0 2px 8px rgba(232,21,10,0.28)'}}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
        {page.published ? <GlobeLock size={14}/> : <Globe size={14}/>}
        <span className="hidden sm:inline">{page.published ? 'Despublicar' : 'Publicar'}</span>
      </button>
    </div>
  )
}
