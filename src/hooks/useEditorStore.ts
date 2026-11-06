import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Page, Block, BlockType, Lang, PageSettings, SeasonMode, BlockCondition } from '@/types'
import { generateId } from '@/lib/utils'
import { BLOCK_BY_TYPE, normalizeBlock } from '@/lib/blocks/registry'

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error'

// Undo/redo covers everything the user can change, not only the block list.
interface Snapshot { blocks: Block[]; settings: PageSettings; name: string }

interface EditorState {
  page: Page | null
  selectedBlockId: string | null
  previewLang: Lang
  previewDevice: 'mobile' | 'tablet' | 'desktop'
  isDirty: boolean
  isSaving: boolean
  saveError: boolean
  lastSavedAt: number | null
  // Bumped on every mutation. A save remembers the revision it sent, so edits
  // made while the request is in flight keep the page "dirty" instead of being
  // silently marked as saved.
  revision: number
  history: Snapshot[]
  historyIndex: number

  // Actions
  setPage: (page: Page) => void
  selectBlock: (id: string | null) => void
  setPreviewLang: (lang: Lang) => void
  setPreviewDevice: (device: 'mobile' | 'tablet' | 'desktop') => void
  setName: (name: string) => void
  setPublished: (published: boolean) => void

  addBlock: (type: BlockType, index?: number) => void
  updateBlock: (id: string, data: Partial<Block['data']>) => void
  updateBlockSeasonFilter: (id: string, seasonFilter: SeasonMode | 'always') => void
  updateBlockCondition: (id: string, condition: BlockCondition | undefined) => void
  removeBlock: (id: string) => void
  reorderBlocks: (blocks: Block[]) => void
  moveBlock: (id: string, direction: -1 | 1) => void
  duplicateBlock: (id: string) => void
  toggleBlockVisibility: (id: string) => void

  updateSettings: (settings: Partial<PageSettings>) => void
  updateSeo: (seo: Partial<PageSettings['seo']>) => void

  setSaving: (v: boolean) => void
  markSaved: (revision: number) => void
  setSaveError: (v: boolean) => void

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

// Typing in a field fires one update per keystroke; those collapse into a
// single undo step while the user keeps editing the same thing.
const COALESCE_MS = 900
let lastEditKey = ''
let lastEditAt = 0

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

function snapshot(state: EditorState): Snapshot {
  return { blocks: clone(state.page!.blocks), settings: clone(state.page!.settings), name: state.page!.name }
}

// Records the current page in the undo stack. `key` identifies "what is being
// edited" so rapid consecutive edits of the same thing replace the top entry.
function commit(state: EditorState, key?: string) {
  if (!state.page) return
  state.isDirty = true
  state.revision += 1
  const now = Date.now()
  const coalesce = !!key && key === lastEditKey && now - lastEditAt < COALESCE_MS && state.historyIndex === state.history.length - 1
  lastEditKey = key ?? ''
  lastEditAt = now
  if (coalesce) {
    state.history[state.historyIndex] = snapshot(state)
    return
  }
  state.history = state.history.slice(0, state.historyIndex + 1)
  state.history.push(snapshot(state))
  state.historyIndex = state.history.length - 1
  if (state.history.length > 80) {
    state.history.shift()
    state.historyIndex--
  }
}

function restore(state: EditorState) {
  const snap = clone(state.history[state.historyIndex])
  state.page!.blocks = snap.blocks
  state.page!.settings = snap.settings
  state.page!.name = snap.name
  if (state.selectedBlockId && !snap.blocks.some(b => b.id === state.selectedBlockId)) state.selectedBlockId = null
  state.isDirty = true
  state.revision += 1
  lastEditKey = ''
}

const reindex = (blocks: Block[]) => blocks.forEach((b, i) => { b.order = i })

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    page: null,
    selectedBlockId: null,
    previewLang: 'es',
    previewDevice: 'mobile',
    isDirty: false,
    isSaving: false,
    saveError: false,
    lastSavedAt: null,
    revision: 0,
    history: [],
    historyIndex: -1,

    setPage: (page) => set(state => {
      // Upgrade any blocks left over from a retired type (e.g. old
      // `menu_pdf` pages) before they ever reach the block list / properties
      // panel -- see normalizeBlock. Saving the page then persists the
      // upgrade for good.
      const blocks = page.blocks.map(normalizeBlock)
      state.page = { ...page, blocks }
      state.previewLang = page.settings.defaultLang
      state.history = [{ blocks: clone(blocks), settings: clone(page.settings), name: page.name }]
      state.historyIndex = 0
      state.isDirty = false
      state.revision = 0
      state.saveError = false
      lastEditKey = ''
    }),

    selectBlock: (id) => set(state => { state.selectedBlockId = id }),
    setPreviewLang: (lang) => set(state => { state.previewLang = lang }),
    setPreviewDevice: (device) => set(state => { state.previewDevice = device }),

    setName: (name) => set(state => {
      if (!state.page) return
      state.page.name = name
      commit(state, 'name')
    }),

    // Publish state is persisted by its own request, not by the autosave.
    setPublished: (published) => set(state => {
      if (state.page) state.page.published = published
    }),

    addBlock: (type, index) => set(state => {
      if (!state.page) return
      const def = BLOCK_BY_TYPE[type]
      if (!def) return
      const newBlock = def.createDefault()
      const blocks = state.page.blocks
      const at = index === undefined ? blocks.length : Math.max(0, Math.min(index, blocks.length))
      blocks.splice(at, 0, newBlock)
      reindex(blocks)
      state.selectedBlockId = newBlock.id
      commit(state)
    }),

    updateBlock: (id, data) => set(state => {
      if (!state.page) return
      const block = state.page.blocks.find(b => b.id === id)
      if (!block) return
      Object.assign(block.data, data)
      commit(state, `block:${id}:${Object.keys(data).join(',')}`)
    }),

    updateBlockSeasonFilter: (id, seasonFilter) => set(state => {
      if (!state.page) return
      const block = state.page.blocks.find(b => b.id === id)
      if (!block) return
      block.seasonFilter = seasonFilter
      commit(state)
    }),

    updateBlockCondition: (id, condition) => set(state => {
      if (!state.page) return
      const block = state.page.blocks.find(b => b.id === id)
      if (!block) return
      block.condition = condition
      commit(state)
    }),

    removeBlock: (id) => set(state => {
      if (!state.page) return
      state.page.blocks = state.page.blocks.filter(b => b.id !== id)
      state.page.blocks.forEach((b, i) => {
        b.order = i
        // A block conditioned on the one just deleted would otherwise point nowhere.
        if (b.condition?.sourceBlockId === id) b.condition = undefined
      })
      if (state.selectedBlockId === id) state.selectedBlockId = null
      commit(state)
    }),

    reorderBlocks: (blocks) => set(state => {
      if (!state.page) return
      state.page.blocks = blocks.map((b, i) => ({ ...b, order: i }))
      commit(state)
    }),

    moveBlock: (id, direction) => set(state => {
      if (!state.page) return
      const blocks = state.page.blocks
      const from = blocks.findIndex(b => b.id === id)
      const to = from + direction
      if (from === -1 || to < 0 || to >= blocks.length) return
      const [moved] = blocks.splice(from, 1)
      blocks.splice(to, 0, moved)
      reindex(blocks)
      commit(state)
    }),

    duplicateBlock: (id) => set(state => {
      if (!state.page) return
      const idx = state.page.blocks.findIndex(b => b.id === id)
      if (idx === -1) return
      const copy = clone(state.page.blocks[idx])
      copy.id = generateId()
      state.page.blocks.splice(idx + 1, 0, copy)
      reindex(state.page.blocks)
      state.selectedBlockId = copy.id
      commit(state)
    }),

    toggleBlockVisibility: (id) => set(state => {
      if (!state.page) return
      const block = state.page.blocks.find(b => b.id === id)
      if (!block) return
      block.visible = !block.visible
      commit(state)
    }),

    updateSettings: (settings) => set(state => {
      if (!state.page) return
      Object.assign(state.page.settings, settings)
      commit(state, `settings:${Object.keys(settings).join(',')}`)
    }),

    updateSeo: (seo) => set(state => {
      if (!state.page) return
      Object.assign(state.page.settings.seo, seo)
      commit(state, `seo:${Object.keys(seo).join(',')}`)
    }),

    setSaving: (v) => set(state => { state.isSaving = v }),
    markSaved: (revision) => set(state => {
      state.lastSavedAt = Date.now()
      state.saveError = false
      // Only clean if nothing changed while the request was in flight.
      state.isDirty = state.revision !== revision
    }),
    setSaveError: (v) => set(state => { state.saveError = v }),

    undo: () => set(state => {
      if (!state.page || state.historyIndex <= 0) return
      state.historyIndex--
      restore(state)
    }),

    redo: () => set(state => {
      if (!state.page || state.historyIndex >= state.history.length - 1) return
      state.historyIndex++
      restore(state)
    }),

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
  }))
)

export function selectSaveStatus(s: Pick<EditorState, 'isSaving' | 'saveError' | 'isDirty'>): SaveStatus {
  if (s.isSaving) return 'saving'
  if (s.saveError) return 'error'
  return s.isDirty ? 'dirty' : 'saved'
}
