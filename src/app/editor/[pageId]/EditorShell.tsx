'use client'
import { useEffect, useState } from 'react'
import { useEditorStore } from '@/hooks/useEditorStore'
import type { Page, Plan, BlockType } from '@/types'
import { PLAN_LIMITS, blockRequiresPro } from '@/types'
import { BLOCK_REGISTRY, BLOCK_CATEGORIES } from '@/lib/blocks/registry'
import { BlockListPanel } from './BlockListPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { EditorPreview } from './EditorPreview'
import { EditorTopBar } from './EditorTopBar'
import toast from 'react-hot-toast'

interface Props { page: Page; plan: Plan }

export function EditorShell({ page, plan }: Props) {
  const { setPage, page: editorPage, addBlock, isDirty, isSaving, setSaving, markSaved, selectedBlockId } = useEditorStore()
  const [addBlockOpen, setAddBlockOpen] = useState(false)
  const limits = PLAN_LIMITS[plan]

  useEffect(() => { setPage(page) }, [])

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
        plan={plan}
      />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '270px 1fr 310px', overflow: 'hidden' }}>
        {/* LEFT: Block list + add */}
        <BlockListPanel
          plan={plan}
          onAddBlock={() => setAddBlockOpen(true)}
        />

        {/* CENTER: Preview */}
        <EditorPreview />

        {/* RIGHT: Properties */}
        <PropertiesPanel plan={plan} />
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
