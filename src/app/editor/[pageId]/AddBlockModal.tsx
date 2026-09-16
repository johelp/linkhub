'use client'
import { useMemo, useState } from 'react'
import { Search, Lock, X } from 'lucide-react'
import type { BlockType } from '@/types'
import { blockRequiresPro, type PlanLimits } from '@/types'
import { BLOCK_CATEGORIES, CATEGORY_META, type BlockDef } from '@/lib/blocks/registry'

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const BORDER = 'rgba(26,27,28,0.09)'

interface Props {
  open: boolean
  limits: PlanLimits
  onClose: () => void
  onAdd: (type: BlockType) => void
}

export function AddBlockModal({ open, limits, onClose, onAdd }: Props) {
  const [query, setQuery] = useState('')

  // Reset on close (a user-triggered event, not a render-phase effect) so
  // reopening the modal next time starts with a clean search box.
  function handleClose() {
    setQuery('')
    onClose()
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return Object.entries(BLOCK_CATEGORIES)
      .map(([cat, blocks]) => [
        cat,
        q ? blocks.filter(b => b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)) : blocks,
      ] as [string, BlockDef[]])
      .filter(([, blocks]) => blocks.length > 0)
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4"
      style={{ background: 'rgba(26,27,28,0.55)' }}
      onClick={handleClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ border: `1px solid ${BORDER}`, boxShadow: '0 24px 60px rgba(26,27,28,0.25)' }}
        onClick={e => e.stopPropagation()}>

        <div className="px-6 pt-6 pb-4 border-b flex-shrink-0" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: INK }}>Añadir bloque</h3>
            <button onClick={handleClose} className="p-2 rounded-lg transition-colors" style={{ color: LIGHT }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F6F6F5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <X size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: LIGHT }} />
            <input
              autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar un bloque... (ej. entradas, sellos, redes)"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: '#F6F6F5', border: `1.5px solid ${BORDER}`, color: INK, fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = '#E8150A')}
              onBlur={e => (e.target.style.borderColor = BORDER)}
            />
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-3xl mb-3">🔍</div>
              <p className="text-sm" style={{ color: LIGHT }}>Ningún bloque coincide con &quot;{query}&quot;</p>
            </div>
          ) : filtered.map(([cat, blocks]) => {
            const meta = CATEGORY_META[cat] ?? CATEGORY_META.layout
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: meta.accent }} />
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: MUTED }}>{meta.label}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {blocks.map(def => (
                    <BlockCard key={def.type} def={def} tint={meta.tint}
                      locked={blockRequiresPro(def.type) && !limits.advancedBlocks}
                      onClick={() => onAdd(def.type)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BlockCard({ def, tint, locked, onClick }: { def: BlockDef; tint: string; locked: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className="relative text-left p-4 rounded-xl border transition-all"
      style={{
        borderColor: hover ? (locked ? BORDER : '#E8150A') : BORDER,
        background: '#fff',
        boxShadow: hover && !locked ? '0 6px 16px rgba(26,27,28,0.08)' : 'none',
        transform: hover && !locked ? 'translateY(-1px)' : 'none',
      }}>
      {locked && (
        <span className="absolute top-3 right-3 rounded-full flex items-center justify-center"
          style={{ width: 22, height: 22, background: '#FEF0EF', color: '#E8150A' }} title="Requiere plan Pro">
          <Lock size={11} />
        </span>
      )}
      <div className="rounded-xl flex items-center justify-center mb-3"
        style={{ width: 40, height: 40, fontSize: 19, background: locked ? '#F6F6F5' : tint, opacity: locked ? 0.6 : 1 }}>
        {def.icon}
      </div>
      <div className="text-sm font-semibold mb-1" style={{ color: locked ? MUTED : INK }}>{def.label}</div>
      <div className="text-xs leading-relaxed pr-5" style={{ color: LIGHT }}>{def.description}</div>
    </button>
  )
}
