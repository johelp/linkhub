import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Page, Block, BlockType, Lang, PageSettings } from '@/types'
import { generateId } from '@/lib/utils'
import { BLOCK_BY_TYPE } from '@/lib/blocks/registry'

interface EditorState {
  page: Page | null
  selectedBlockId: string | null
  previewLang: Lang
  previewDevice: 'mobile' | 'tablet' | 'desktop'
  isDirty: boolean
  isSaving: boolean
  history: Block[][]
  historyIndex: number

  // Actions
  setPage: (page: Page) => void
  selectBlock: (id: string | null) => void
  setPreviewLang: (lang: Lang) => void
  setPreviewDevice: (device: 'mobile' | 'tablet' | 'desktop') => void

  addBlock: (type: BlockType, afterId?: string) => void
  updateBlock: (id: string, data: Partial<Block['data']>) => void
  removeBlock: (id: string) => void
  reorderBlocks: (blocks: Block[]) => void
  duplicateBlock: (id: string) => void
  toggleBlockVisibility: (id: string) => void

  updateSettings: (settings: Partial<PageSettings>) => void
  updateSeo: (seo: Partial<PageSettings['seo']>) => void

  setSaving: (v: boolean) => void
  markSaved: () => void

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    page: null,
    selectedBlockId: null,
    previewLang: 'es',
    previewDevice: 'mobile',
    isDirty: false,
    isSaving: false,
    history: [],
    historyIndex: -1,

    setPage: (page) => set(state => {
      state.page = page
      state.history = [page.blocks]
      state.historyIndex = 0
      state.isDirty = false
    }),

    selectBlock: (id) => set(state => { state.selectedBlockId = id }),
    setPreviewLang: (lang) => set(state => { state.previewLang = lang }),
    setPreviewDevice: (device) => set(state => { state.previewDevice = device }),

    addBlock: (type, afterId) => set(state => {
      if (!state.page) return
      const def = BLOCK_BY_TYPE[type]
      if (!def) return
      const newBlock = def.createDefault(state.previewLang)
      const blocks = state.page.blocks
      const insertIndex = afterId
        ? blocks.findIndex(b => b.id === afterId) + 1
        : blocks.length
      blocks.splice(insertIndex, 0, newBlock)
      blocks.forEach((b, i) => { b.order = i })
      state.selectedBlockId = newBlock.id
      state.isDirty = true
      pushHistory(state)
    }),

    updateBlock: (id, data) => set(state => {
      if (!state.page) return
      const block = state.page.blocks.find(b => b.id === id)
      if (!block) return
      Object.assign(block.data, data)
      state.isDirty = true
    }),

    removeBlock: (id) => set(state => {
      if (!state.page) return
      state.page.blocks = state.page.blocks.filter(b => b.id !== id)
      state.page.blocks.forEach((b, i) => { b.order = i })
      if (state.selectedBlockId === id) state.selectedBlockId = null
      state.isDirty = true
      pushHistory(state)
    }),

    reorderBlocks: (blocks) => set(state => {
      if (!state.page) return
      state.page.blocks = blocks.map((b, i) => ({ ...b, order: i }))
      state.isDirty = true
      pushHistory(state)
    }),

    duplicateBlock: (id) => set(state => {
      if (!state.page) return
      const idx = state.page.blocks.findIndex(b => b.id === id)
      if (idx === -1) return
      const original = state.page.blocks[idx]
      const clone = JSON.parse(JSON.stringify(original))
      clone.id = generateId()
      state.page.blocks.splice(idx + 1, 0, clone)
      state.page.blocks.forEach((b, i) => { b.order = i })
      state.selectedBlockId = clone.id
      state.isDirty = true
      pushHistory(state)
    }),

    toggleBlockVisibility: (id) => set(state => {
      if (!state.page) return
      const block = state.page.blocks.find(b => b.id === id)
      if (!block) return
      block.visible = !block.visible
      state.isDirty = true
    }),

    updateSettings: (settings) => set(state => {
      if (!state.page) return
      Object.assign(state.page.settings, settings)
      state.isDirty = true
    }),

    updateSeo: (seo) => set(state => {
      if (!state.page) return
      Object.assign(state.page.settings.seo, seo)
      state.isDirty = true
    }),

    setSaving: (v) => set(state => { state.isSaving = v }),
    markSaved: () => set(state => { state.isDirty = false }),

    undo: () => set(state => {
      if (!state.page || state.historyIndex <= 0) return
      state.historyIndex--
      state.page.blocks = JSON.parse(JSON.stringify(state.history[state.historyIndex]))
      state.isDirty = true
    }),

    redo: () => set(state => {
      if (!state.page || state.historyIndex >= state.history.length - 1) return
      state.historyIndex++
      state.page.blocks = JSON.parse(JSON.stringify(state.history[state.historyIndex]))
      state.isDirty = true
    }),

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
  }))
)

function pushHistory(state: EditorState) {
  if (!state.page) return
  // Trim redo history
  state.history = state.history.slice(0, state.historyIndex + 1)
  state.history.push(JSON.parse(JSON.stringify(state.page.blocks)))
  state.historyIndex = state.history.length - 1
  // Keep max 50 history states
  if (state.history.length > 50) {
    state.history.shift()
    state.historyIndex--
  }
}
