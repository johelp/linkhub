'use client'
import { useEditorStore } from '@/hooks/useEditorStore'
import type { Block, Plan } from '@/types'
import { BLOCK_BY_TYPE } from '@/lib/blocks/registry'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Eye, EyeOff, Trash2, Copy } from 'lucide-react'

interface Props {
  plan: Plan
  onAddBlock: () => void
}

export function BlockListPanel({ plan, onAddBlock }: Props) {
  const { page, selectedBlockId, selectBlock, removeBlock, duplicateBlock, toggleBlockVisibility, reorderBlocks } = useEditorStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!page) return null

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const blocks = page!.blocks
    const oldIdx = blocks.findIndex(b => b.id === active.id)
    const newIdx = blocks.findIndex(b => b.id === over.id)
    reorderBlocks(arrayMove(blocks, oldIdx, newIdx))
  }

  return (
    <div className="flex flex-col h-full border-r overflow-hidden bg-white"
      style={{borderColor:'rgba(26,27,28,0.09)'}}>

      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{borderColor:'rgba(26,27,28,0.09)'}}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{color:'#9A9D9F'}}>
          Bloques ({page.blocks.length})
        </span>
        <button onClick={onAddBlock}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
          style={{background:'#FEF0EF',color:'#E8150A'}}>
          <Plus size={13}/> Añadir
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {page.blocks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-xs" style={{color:'#9A9D9F'}}>Añadí tu primer bloque</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={page.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {page.blocks.map(block => (
                <SortableBlockItem
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => selectBlock(block.id === selectedBlockId ? null : block.id)}
                  onDelete={() => removeBlock(block.id)}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onToggleVisibility={() => toggleBlockVisibility(block.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

function SortableBlockItem({ block, isSelected, onSelect, onDelete, onDuplicate, onToggleVisibility }: {
  block: Block
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleVisibility: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const def = BLOCK_BY_TYPE[block.type]

  return (
    <div ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 2,
      }}>
      <div onClick={onSelect}
        className="flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer group"
        style={{
          background: isSelected ? '#FEF0EF' : 'transparent',
          border: `1.5px solid ${isSelected ? '#E8150A' : 'transparent'}`,
        }}>
        {/* Drag handle */}
        <div {...attributes} {...listeners}
          className="drag-handle flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{color:'#9A9D9F'}}>
          <GripVertical size={14}/>
        </div>

        {/* Icon */}
        <span className="text-base flex-shrink-0">{def?.icon || '📦'}</span>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{color: block.visible ? '#1A1B1C' : '#9A9D9F'}}>
            {def?.label || block.type}
          </p>
        </div>

        {/* Actions - show on hover */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <ActionBtn onClick={e => { e.stopPropagation(); onToggleVisibility() }} title={block.visible ? 'Ocultar' : 'Mostrar'}>
            {block.visible ? <Eye size={11}/> : <EyeOff size={11}/>}
          </ActionBtn>
          <ActionBtn onClick={e => { e.stopPropagation(); onDuplicate() }} title="Duplicar">
            <Copy size={11}/>
          </ActionBtn>
          <ActionBtn onClick={e => { e.stopPropagation(); onDelete() }} title="Eliminar" danger>
            <Trash2 size={11}/>
          </ActionBtn>
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ onClick, title, danger, children }: {
  onClick: (e: React.MouseEvent) => void
  title: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button onClick={onClick} title={title}
      className="p-1 rounded-md transition-colors"
      style={{color: danger ? '#E8150A' : '#9A9D9F'}}>
      {children}
    </button>
  )
}
