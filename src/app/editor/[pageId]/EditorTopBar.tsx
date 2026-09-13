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
    <div className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 h-12 bg-white border-b flex-shrink-0 overflow-x-auto"
      style={{borderColor:'rgba(26,27,28,0.09)'}}>

      {/* Back */}
      <Link href="/dashboard" className="flex items-center gap-1.5 text-sm mr-1 lg:mr-2 flex-shrink-0"
        style={{color:'#9A9D9F'}}>
        <ArrowLeft size={14}/> <span className="hidden sm:inline">Páginas</span>
      </Link>

      {/* Page name */}
      <div className="text-sm font-semibold truncate max-w-[120px] sm:max-w-[180px] flex-shrink-0" style={{color:'#1A1B1C'}}>
        {page.name}
      </div>

      {/* Dirty indicator */}
      {isDirty && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:'#FF8C00'}} title="Cambios sin guardar"/>}

      <div className="flex-1"/>

      {/* Undo/Redo */}
      <button onClick={undo} disabled={!canUndo()} title="Deshacer"
        className="p-1.5 rounded-lg disabled:opacity-30 transition-colors hover:bg-gray-50 flex-shrink-0"
        style={{color:'#5A5D60'}}>
        <Undo2 size={15}/>
      </button>
      <button onClick={redo} disabled={!canRedo()} title="Rehacer"
        className="p-1.5 rounded-lg disabled:opacity-30 transition-colors hover:bg-gray-50 flex-shrink-0"
        style={{color:'#5A5D60'}}>
        <Redo2 size={15}/>
      </button>

      {/* Device preview toggle — only meaningful with room to spare; on a real
          small screen you're already looking at the mobile viewport. */}
      <div className="hidden lg:flex gap-0.5 bg-gray-100 p-0.5 rounded-lg flex-shrink-0">
        {[
          { d: 'mobile' as const, icon: <Smartphone size={13}/>, label: 'Móvil' },
          { d: 'tablet' as const, icon: <Tablet size={13}/>, label: 'Tablet' },
          { d: 'desktop' as const, icon: <Monitor size={13}/>, label: 'Escritorio' },
        ].map(({ d, icon, label }) => (
          <button key={d} onClick={() => setPreviewDevice(d)} title={label}
            className="p-1.5 rounded-md transition-colors"
            style={{
              background: previewDevice === d ? '#fff' : 'transparent',
              color: previewDevice === d ? '#1A1B1C' : '#9A9D9F',
              boxShadow: previewDevice === d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
            {icon}
          </button>
        ))}
      </div>

      {/* View live */}
      {page.published && (
        <Link href={`/p/${page.slug}`} target="_blank"
          className="hidden sm:block text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{background:'#F6F6F5',color:'#5A5D60'}}>
          Ver →
        </Link>
      )}

      {/* Save */}
      <button onClick={onSave} disabled={!isDirty || isSaving}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 transition-all flex-shrink-0"
        style={{background:'#F6F6F5',color:'#1A1B1C'}}>
        {isSaving ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
        <span className="hidden sm:inline">Guardar</span>
      </button>

      {/* Publish */}
      <button onClick={onPublish}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all flex-shrink-0"
        style={{background: page.published ? '#B50F07' : '#E8150A'}}>
        {page.published ? <GlobeLock size={13}/> : <Globe size={13}/>}
        <span className="hidden sm:inline">{page.published ? 'Despublicar' : 'Publicar'}</span>
      </button>
    </div>
  )
}
