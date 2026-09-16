'use client'
import { useEffect, useState } from 'react'
import { Layers, Eye, Settings2 } from 'lucide-react'
import { useEditorStore } from '@/hooks/useEditorStore'
import type { Page, Plan, BlockType } from '@/types'
import { PLAN_LIMITS, blockRequiresPro } from '@/types'
import { BlockListPanel } from './BlockListPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { EditorPreview } from './EditorPreview'
import { EditorTopBar } from './EditorTopBar'
import { AddBlockModal } from './AddBlockModal'
import toast from 'react-hot-toast'

interface Props { page: Page; plan: Plan }

type MobileTab = 'blocks' | 'preview' | 'properties'

export function EditorShell({ page, plan }: Props) {
  const { setPage, page: editorPage, addBlock, isDirty, isSaving, setSaving, markSaved, selectedBlockId } = useEditorStore()
  const [addBlockOpen, setAddBlockOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('blocks')
  const limits = PLAN_LIMITS[plan]

  useEffect(() => { setPage(page) }, [page, setPage])

  // On small screens, jump to the properties tab as soon as a block is selected
  // so tapping a block in the list actually shows its editor.
  useEffect(() => {
    if (selectedBlockId) setMobileTab('properties')
  }, [selectedBlockId])

  // Warn before closing the tab / navigating away with unsaved changes.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  async function savePage() {
    if (!editorPage || isSaving) return
    setSaving(true)
    try {
      const res = await fetch('/api/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: editorPage.id,
          blocks: editorPage.blocks,
          settings: editorPage.settings,
          name: editorPage.name,
        }),
      })
      if (!res.ok) throw new Error()
      markSaved()
      toast.success('Guardado ✓')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish() {
    if (!editorPage) return
    setSaving(true)
    try {
      const res = await fetch('/api/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: editorPage.id, published: !editorPage.published }),
      })
      if (!res.ok) throw new Error()
      useEditorStore.getState().updateSettings({ ...editorPage.settings }) // force re-render
      toast.success(editorPage.published ? 'Despublicada' : '¡Publicada! ✓')
    } catch {
      toast.error('Error')
    } finally {
      setSaving(false)
    }
  }

  function handleAddBlock(type: BlockType) {
    if (blockRequiresPro(type) && !limits.advancedBlocks) {
      toast.error('Este bloque requiere plan Pro')
      return
    }
    addBlock(type, selectedBlockId || undefined)
    setAddBlockOpen(false)
  }

  if (!editorPage) {
    return (
      <div className="flex items-center justify-center h-screen" style={{background:'#F6F6F5'}}>
        <div className="text-center">
          <div className="text-4xl mb-3">⚙️</div>
          <p className="text-sm" style={{color:'#9A9D9F'}}>Cargando editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F6F6F5' }}>
      <EditorTopBar
        page={editorPage}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={savePage}
        onPublish={togglePublish}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[270px_1fr_310px] overflow-hidden min-h-0">
        {/* LEFT: Block list + add */}
        <div className={`${mobileTab === 'blocks' ? 'flex' : 'hidden'} lg:flex min-h-0 flex-col`}>
          <BlockListPanel
            onAddBlock={() => setAddBlockOpen(true)}
          />
        </div>

        {/* CENTER: Preview */}
        <div className={`${mobileTab === 'preview' ? 'flex' : 'hidden'} lg:flex min-h-0 flex-col`}>
          <EditorPreview />
        </div>

        {/* RIGHT: Properties */}
        <div className={`${mobileTab === 'properties' ? 'flex' : 'hidden'} lg:flex min-h-0 flex-col`}>
          <PropertiesPanel plan={plan} />
        </div>
      </div>

      {/* Mobile/tablet tab bar — the 3-column layout only works on large screens */}
      <div className="flex lg:hidden border-t flex-shrink-0" style={{ borderColor: 'rgba(26,27,28,0.09)' }}>
        {([
          { id: 'blocks' as const, icon: <Layers size={15} />, label: 'Bloques' },
          { id: 'preview' as const, icon: <Eye size={15} />, label: 'Vista previa' },
          { id: 'properties' as const, icon: <Settings2 size={15} />, label: 'Editar' },
        ]).map(t => (
          <button key={t.id} onClick={() => setMobileTab(t.id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium"
            style={{ color: mobileTab === t.id ? '#E8150A' : '#9A9D9F' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <AddBlockModal open={addBlockOpen} limits={limits} onClose={() => setAddBlockOpen(false)} onAdd={handleAddBlock} />
    </div>
  )
}
