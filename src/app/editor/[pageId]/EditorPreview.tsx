'use client'
import { Plus } from 'lucide-react'
import { useEditorStore } from '@/hooks/useEditorStore'
import { PageView, type EditingControls } from '@/app/p/[slug]/PageView'
import { QUICK_START_BLOCKS } from '@/lib/blocks/registry'

const WIDTHS = { mobile: 390, tablet: 768, desktop: 1100 } as const

// The canvas: the real public page, but every block is clickable to select,
// and "+" slots between blocks insert new ones exactly where you point.
export function EditorPreview({ onAddAt }: { onAddAt: (index?: number) => void }) {
  const page = useEditorStore(s => s.page)
  const device = useEditorStore(s => s.previewDevice)
  const lang = useEditorStore(s => s.previewLang)
  const selectedBlockId = useEditorStore(s => s.selectedBlockId)

  if (!page) return null
  const store = useEditorStore.getState()

  const controls: EditingControls = {
    lang,
    selectedBlockId,
    onSelect: id => useEditorStore.getState().selectBlock(id),
    onInsertAt: i => onAddAt(i),
    onMove: (id, dir) => useEditorStore.getState().moveBlock(id, dir),
    onDuplicate: id => useEditorStore.getState().duplicateBlock(id),
    onToggleVisibility: id => useEditorStore.getState().toggleBlockVisibility(id),
    onDelete: id => useEditorStore.getState().removeBlock(id),
  }

  const framed = device !== 'desktop'

  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-auto" style={{ background: '#E5E7EB' }}
      // Clicking the grey area around the page deselects (inspector shows page settings).
      onClick={e => { if (e.target === e.currentTarget) store.selectBlock(null) }}>
      {/* Phones: the top bar has no room for the language switcher, so it lives here */}
      {(page.settings.enabledLangs?.length ?? 0) > 1 && (
        <div className="sm:hidden sticky top-0 z-10 flex justify-center gap-1 p-2 bg-[#E5E7EB]">
          {page.settings.enabledLangs.map(l => (
            <button key={l} onClick={() => store.setPreviewLang(l)} aria-pressed={lang === l}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold"
              style={{ background: lang === l ? '#1A1B1C' : '#fff', color: lang === l ? '#fff' : '#5A5D60' }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col items-center px-3 py-6 min-h-full"
        onClick={e => { if (e.target === e.currentTarget) store.selectBlock(null) }}>
        <div className={`bg-white flex-shrink-0 overflow-hidden ${framed ? 'border-[8px] border-[#1A1B1C] rounded-[32px]' : 'border border-[rgba(26,27,28,0.12)] rounded-xl'} max-sm:border-0 max-sm:rounded-none`}
          style={{ width: WIDTHS[device], maxWidth: '100%', boxShadow: '0 12px 40px rgba(26,27,28,0.18)', transition: 'width .25s ease' }}>
          <PageView page={page} editing controls={controls} />

          {page.blocks.length === 0 && (
            <div className="px-5 pb-8 -mt-2 text-center">
              <p className="text-sm font-semibold" style={{ color: '#1A1B1C' }}>Empezá por lo esencial</p>
              <p className="text-xs mb-3" style={{ color: '#6B6E71' }}>Un toque y se agrega a tu página</p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_START_BLOCKS.map(q => (
                  <button key={q.type} onClick={() => store.addBlock(q.type)}
                    className="px-3 py-2 rounded-xl text-[13px] font-semibold"
                    style={{ background: '#F6F6F5', color: '#1A1B1C', border: '1px solid rgba(26,27,28,0.1)' }}>
                    {q.icon} {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => onAddAt()}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold flex-shrink-0"
          style={{ background: '#fff', color: '#E8150A', border: '1.5px dashed #E8150A' }}>
          <Plus size={15} /> Añadir bloque
        </button>
        <p className="py-3 text-xs" style={{ color: '#6B6E71' }}>linkhub.app/p/{page.slug}</p>
      </div>
    </div>
  )
}
