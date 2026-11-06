'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Layers, Eye, Settings2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEditorStore } from '@/hooks/useEditorStore'
import type { Page, Plan, BlockType } from '@/types'
import { PLAN_LIMITS, blockRequiresPro } from '@/types'
import { BlockListPanel } from './BlockListPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { EditorPreview } from './EditorPreview'
import { EditorTopBar } from './EditorTopBar'
import { AddBlockModal } from './AddBlockModal'
import { PublishDialog } from './PublishDialog'

interface Props { page: Page; plan: Plan }

type MobileTab = 'blocks' | 'preview' | 'properties'

const AUTOSAVE_DELAY = 1500
const RETRY_DELAY = 8000

function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

export function EditorShell({ page, plan }: Props) {
  const ready = useEditorStore(s => s.page !== null)
  const isDirty = useEditorStore(s => s.isDirty)
  const isSaving = useEditorStore(s => s.isSaving)
  const saveError = useEditorStore(s => s.saveError)
  const revision = useEditorStore(s => s.revision)

  // null = closed; a number = insert the new block at that position.
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview')
  const limits = PLAN_LIMITS[plan]
  const savingRef = useRef(false)

  useEffect(() => { useEditorStore.getState().setPage(page) }, [page])

  // On small screens, jump to the editing tab as soon as a block is selected.
  useEffect(() => {
    return useEditorStore.subscribe((s, prev) => {
      if (s.selectedBlockId && s.selectedBlockId !== prev.selectedBlockId) setMobileTab('properties')
    })
  }, [])

  // Warn before closing the tab / navigating away with unsaved changes.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (useEditorStore.getState().isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Returns true when the page is persisted. Safe to call concurrently.
  const savePage = useCallback(async (): Promise<boolean> => {
    const st = useEditorStore.getState()
    if (!st.page || savingRef.current) return false
    savingRef.current = true
    const sentRevision = st.revision
    st.setSaving(true)
    try {
      const res = await fetch('/api/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: st.page.id,
          blocks: st.page.blocks,
          settings: st.page.settings,
          name: st.page.name,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'No se pudo guardar')
      }
      useEditorStore.getState().markSaved(sentRevision)
      return true
    } catch (err) {
      useEditorStore.getState().setSaveError(true)
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar', { id: 'save-error' })
      return false
    } finally {
      savingRef.current = false
      useEditorStore.getState().setSaving(false)
    }
  }, [])

  // Autosave: shortly after the last edit (and retry with a longer pause after
  // a failure) so nobody has to remember to press "Guardar".
  useEffect(() => {
    if (!ready || !isDirty || isSaving) return
    const t = setTimeout(() => { void savePage() }, saveError ? RETRY_DELAY : AUTOSAVE_DELAY)
    return () => clearTimeout(t)
  }, [ready, isDirty, isSaving, saveError, revision, savePage])

  const setPublished = useCallback(async (published: boolean): Promise<boolean> => {
    const st = useEditorStore.getState()
    if (!st.page) return false
    if (published && st.isDirty && !(await savePage())) return false
    try {
      const res = await fetch('/api/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: st.page.id, published }),
      })
      if (!res.ok) throw new Error()
      useEditorStore.getState().setPublished(published)
      return true
    } catch {
      toast.error(published ? 'No se pudo publicar' : 'No se pudo despublicar')
      return false
    }
  }, [savePage])

  const openAdd = useCallback((index?: number) => {
    const st = useEditorStore.getState()
    if (index !== undefined) return setInsertAt(index)
    // From the toolbar: right after the selected block, else at the end.
    const sel = st.page?.blocks.findIndex(b => b.id === st.selectedBlockId) ?? -1
    setInsertAt(sel >= 0 ? sel + 1 : (st.page?.blocks.length ?? 0))
  }, [])

  function handleAddBlock(type: BlockType) {
    if (blockRequiresPro(type) && !limits.advancedBlocks) {
      toast.error('Este bloque requiere plan Pro')
      return
    }
    useEditorStore.getState().addBlock(type, insertAt ?? undefined)
    setInsertAt(null)
  }

  // Keyboard: ⌘/Ctrl+S save, ⌘/Ctrl+Z undo, ⇧⌘Z / Ctrl+Y redo, ⌘/Ctrl+D duplicate,
  // Delete removes the selected block, Esc deselects.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const st = useEditorStore.getState()
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && key === 's') { e.preventDefault(); void savePage(); return }
      if (mod && key === 'k') { e.preventDefault(); openAdd(); return }
      if (isTypingTarget(e.target)) return
      if (mod && key === 'z') { e.preventDefault(); if (e.shiftKey) st.redo(); else st.undo(); return }
      if (mod && key === 'y') { e.preventDefault(); st.redo(); return }
      if (mod && key === 'd' && st.selectedBlockId) { e.preventDefault(); st.duplicateBlock(st.selectedBlockId); return }
      if ((key === 'delete' || key === 'backspace') && st.selectedBlockId) { e.preventDefault(); st.removeBlock(st.selectedBlockId); return }
      if (key === 'escape') st.selectBlock(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [savePage, openAdd])

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#F6F6F5' }}>
        <p className="text-sm" style={{ color: '#9A9D9F' }}>Cargando editor...</p>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F6F6F5' }}>
      <EditorTopBar onSaveNow={() => { void savePage() }} onPublishClick={() => setPublishOpen(true)} />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] overflow-hidden min-h-0">
        <div className={`${mobileTab === 'blocks' ? 'flex' : 'hidden'} lg:flex min-h-0 min-w-0 flex-col`}>
          <BlockListPanel onAddBlock={() => openAdd()} />
        </div>

        <div className={`${mobileTab === 'preview' ? 'flex' : 'hidden'} lg:flex min-h-0 min-w-0 flex-col`}>
          <EditorPreview onAddAt={openAdd} />
        </div>

        <div className={`${mobileTab === 'properties' ? 'flex' : 'hidden'} lg:flex min-h-0 min-w-0 flex-col`}>
          <PropertiesPanel plan={plan} />
        </div>
      </div>

      {/* Mobile/tablet tab bar — the 3-column layout only works on large screens */}
      <div className="flex lg:hidden border-t flex-shrink-0 bg-white" style={{ borderColor: 'rgba(26,27,28,0.09)' }}>
        {([
          { id: 'blocks' as const, icon: <Layers size={16} />, label: 'Estructura' },
          { id: 'preview' as const, icon: <Eye size={16} />, label: 'Vista' },
          { id: 'properties' as const, icon: <Settings2 size={16} />, label: 'Editar' },
        ]).map(t => (
          <button key={t.id} onClick={() => setMobileTab(t.id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium"
            style={{ color: mobileTab === t.id ? '#E8150A' : '#9A9D9F' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AddBlockModal open={insertAt !== null} limits={limits} onClose={() => setInsertAt(null)} onAdd={handleAddBlock} />
      <PublishDialog open={publishOpen} onClose={() => setPublishOpen(false)} onSetPublished={setPublished} />
    </div>
  )
}
