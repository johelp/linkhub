'use client'
import { useEffect, useState } from 'react'
import { Layers, Eye, Settings2 } from 'lucide-react'
import { useEditorStore } from '@/hooks/useEditorStore'
import type { Page, Plan, BlockType } from '@/types'
import { PLAN_LIMITS, blockRequiresPro } from '@/types'
import { BLOCK_CATEGORIES } from '@/lib/blocks/registry'
import { BlockListPanel } from './BlockListPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { EditorPreview } from './EditorPreview'
import { EditorTopBar } from './EditorTopBar'
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

      {/* Add Block Modal */}
      {addBlockOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4"
          style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-auto"
            style={{border:'1px solid rgba(26,27,28,0.09)'}}>
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b" style={{borderColor:'rgba(26,27,28,0.09)'}}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold" style={{color:'#1A1B1C'}}>Añadir bloque</h3>
                <button onClick={() => setAddBlockOpen(false)} style={{color:'#9A9D9F',fontSize:20,lineHeight:1}}>×</button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {Object.entries(BLOCK_CATEGORIES).map(([cat, blocks]) => (
                <div key={cat}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#9A9D9F'}}>
                    {cat === 'navigation' ? 'Navegación' : cat === 'content' ? 'Contenido' : cat === 'social' ? 'Redes' : 'Diseño'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {blocks.map(def => {
                      const locked = blockRequiresPro(def.type) && !limits.advancedBlocks
                      return (
                        <button key={def.type} onClick={() => handleAddBlock(def.type)}
                          className="text-left p-3 rounded-xl border transition-all"
                          style={{
                            borderColor: locked ? 'rgba(26,27,28,0.06)' : 'rgba(26,27,28,0.09)',
                            background: locked ? '#F9F9F9' : '#F6F6F5',
                            opacity: locked ? 0.7 : 1,
                          }}>
                          <div style={{fontSize:20,marginBottom:4}}>{def.icon}</div>
                          <div className="text-sm font-semibold" style={{color:'#1A1B1C'}}>{def.label}</div>
                          <div className="text-xs" style={{color:'#9A9D9F'}}>{def.description}</div>
                          {locked && (
                            <div className="mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full inline-block"
                              style={{background:'#FEF0EF',color:'#E8150A'}}>
                              Pro
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
