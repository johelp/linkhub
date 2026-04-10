'use client'
import { useState } from 'react'
import { useEditorStore } from '@/hooks/useEditorStore'
import type { Plan, Lang, Block, LinkBlock, FeaturedBlock, ExpandableBlock, SectionLabelBlock, TextBlock, ContactCardBlock, SocialGridBlock, PageSettings } from '@/types'
import { PLAN_LIMITS } from '@/types'
import { COLOR_SCHEMES, ICON_BG_PRESETS } from '@/lib/blocks/registry'
import { generateId } from '@/lib/utils'
import { Settings, Layout, Globe } from 'lucide-react'

const ALL_LANGS: { code: Lang; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
]

interface Props { plan: Plan }

type Tab = 'block' | 'page' | 'seo'

export function PropertiesPanel({ plan }: Props) {
  const { page, selectedBlockId, updateBlock, updateSettings, updateSeo, previewLang } = useEditorStore()
  const [tab, setTab] = useState<Tab>('block')
  const limits = PLAN_LIMITS[plan]

  if (!page) return null

  const selectedBlock = selectedBlockId ? page.blocks.find(b => b.id === selectedBlockId) : null

  return (
    <div className="flex flex-col h-full bg-white border-l overflow-hidden"
      style={{ borderColor: 'rgba(26,27,28,0.09)' }}>

      {/* Tabs */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: 'rgba(26,27,28,0.09)' }}>
        {([
          { id: 'block', icon: <Layout size={13} />, label: 'Bloque' },
          { id: 'page', icon: <Settings size={13} />, label: 'Página' },
          { id: 'seo', icon: <Globe size={13} />, label: 'SEO' },
        ] as { id: Tab; icon: React.ReactNode; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors"
            style={{
              borderBottom: tab === t.id ? '2px solid #E8150A' : '2px solid transparent',
              color: tab === t.id ? '#E8150A' : '#9A9D9F',
            }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'block' && (
          selectedBlock
            ? <BlockEditor block={selectedBlock} lang={previewLang} plan={plan} onUpdate={updateBlock} />
            : <div className="text-center py-12">
                <div className="text-3xl mb-2">👆</div>
                <p className="text-xs" style={{ color: '#9A9D9F' }}>Seleccioná un bloque<br />para editarlo</p>
              </div>
        )}
        {tab === 'page' && <PageSettingsEditor settings={page.settings} limits={limits} onUpdate={updateSettings} />}
        {tab === 'seo' && <SeoEditor seo={page.settings.seo} onUpdate={updateSeo} />}
      </div>
    </div>
  )
}

// ─── Block Editor ────────────────────────────────────────────────
function BlockEditor({ block, lang, plan, onUpdate }: {
  block: Block; lang: Lang; plan: Plan
  onUpdate: (id: string, data: Partial<Block['data']>) => void
}) {
  const limits = PLAN_LIMITS[plan]

  switch (block.type) {
    case 'link': return <LinkEditor block={block as LinkBlock} lang={lang} limits={limits} onUpdate={onUpdate} />
    case 'featured': return <FeaturedEditor block={block as FeaturedBlock} lang={lang} onUpdate={onUpdate} />
    case 'expandable': return <ExpandableEditor block={block as ExpandableBlock} lang={lang} onUpdate={onUpdate} />
    case 'section_label': return <SectionLabelEditor block={block as SectionLabelBlock} lang={lang} onUpdate={onUpdate} />
    case 'text': return <TextEditor block={block as TextBlock} lang={lang} onUpdate={onUpdate} />
    case 'contact_card': return <ContactCardEditor block={block as ContactCardBlock} onUpdate={onUpdate} />
    case 'social_grid': return <SocialGridEditor block={block as SocialGridBlock} onUpdate={onUpdate} />
    case 'divider': return <DividerEditor block={block} onUpdate={onUpdate} />
    default: return <p className="text-xs" style={{ color: '#9A9D9F' }}>Sin opciones para este bloque.</p>
  }
}

// ─── Link Editor ─────────────────────────────────────────────────
function LinkEditor({ block, lang, limits, onUpdate }: { block: LinkBlock; lang: Lang; limits: import('@/types').PlanLimits; onUpdate: (id: string, d: any) => void }) {
  const t = block.data.translations[lang] || block.data.translations['es'] || { title: '', description: '' }
  const setT = (key: string, val: string) => onUpdate(block.id, {
    translations: { ...block.data.translations, [lang]: { ...t, [key]: val } }
  })
  return (
    <div className="space-y-4">
      <Section label="Textos">
        <Field label="Título">
          <Input value={t.title} onChange={v => setT('title', v)} />
        </Field>
        <Field label="Descripción">
          <Input value={t.description} onChange={v => setT('description', v)} placeholder="Opcional" />
        </Field>
      </Section>
      <Section label="Enlace">
        <Field label="URL">
          <Input value={block.data.url} onChange={v => onUpdate(block.id, { url: v })} placeholder="https://" />
        </Field>
        <Toggle label="Abrir en nueva pestaña" value={block.data.openInNewTab}
          onChange={v => onUpdate(block.id, { openInNewTab: v })} />
      </Section>
      <Section label="Icono">
        <Field label="Emoji / icono">
          <Input value={block.data.icon} onChange={v => onUpdate(block.id, { icon: v })} placeholder="🔗" />
        </Field>
        <Field label="Color de fondo">
          <div className="flex flex-wrap gap-2">
            {Object.entries(ICON_BG_PRESETS).map(([key, color]) => (
              <button key={key} onClick={() => onUpdate(block.id, { iconBg: key })}
                className="w-7 h-7 rounded-lg border-2 transition-all"
                style={{ background: color, borderColor: block.data.iconBg === key ? '#E8150A' : 'transparent' }} />
            ))}
          </div>
        </Field>
      </Section>
      {limits.seasonFilter && <SeasonField value={block.seasonFilter} onChange={v => onUpdate(block.id, { seasonFilter: v } as any)} />}
    </div>
  )
}

// ─── Featured Editor ─────────────────────────────────────────────
function FeaturedEditor({ block, lang, onUpdate }: { block: FeaturedBlock; lang: Lang; onUpdate: (id: string, d: any) => void }) {
  const t = block.data.translations[lang] || block.data.translations['es'] || { title: '', description: '' }
  const setT = (key: string, val: string) => onUpdate(block.id, {
    translations: { ...block.data.translations, [lang]: { ...t, [key]: val } }
  })
  const badge = block.data.badge[lang] || ''
  return (
    <div className="space-y-4">
      <Section label="Textos">
        <Field label="Badge">
          <Input value={badge} onChange={v => onUpdate(block.id, { badge: { ...block.data.badge, [lang]: v } })} placeholder="Novedad" />
        </Field>
        <Field label="Título">
          <Input value={t.title} onChange={v => setT('title', v)} />
        </Field>
        <Field label="Descripción">
          <Input value={t.description} onChange={v => setT('description', v)} />
        </Field>
      </Section>
      <Section label="Enlace">
        <Field label="URL"><Input value={block.data.url} onChange={v => onUpdate(block.id, { url: v })} placeholder="https://" /></Field>
      </Section>
      <Section label="Diseño">
        <Field label="Icono"><Input value={block.data.icon} onChange={v => onUpdate(block.id, { icon: v })} placeholder="☀️" /></Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
              <button key={key} onClick={() => onUpdate(block.id, { colorScheme: key })}
                className="w-7 h-7 rounded-lg border-2 transition-all"
                style={{ background: scheme.bg, borderColor: block.data.colorScheme === key ? '#1A1B1C' : 'transparent' }} />
            ))}
          </div>
        </Field>
      </Section>
      <SeasonField value={block.seasonFilter} onChange={v => onUpdate(block.id, { seasonFilter: v } as any)} />
    </div>
  )
}

// ─── Expandable Editor ───────────────────────────────────────────
function ExpandableEditor({ block, lang, onUpdate }: { block: ExpandableBlock; lang: Lang; onUpdate: (id: string, d: any) => void }) {
  const t = block.data.translations[lang] || block.data.translations['es'] || { title: '', subtitle: '' }
  const setT = (key: string, val: string) => onUpdate(block.id, {
    translations: { ...block.data.translations, [lang]: { ...t, [key]: val } }
  })
  const children = block.data.children

  function updateChild(childId: string, key: string, val: string) {
    const updated = children.map(c => {
      if (c.id !== childId) return c
      const ct = c.translations[lang] || c.translations['es'] || {}
      return { ...c, translations: { ...c.translations, [lang]: { ...ct, [key]: val } } }
    })
    onUpdate(block.id, { children: updated })
  }
  function updateChildUrl(childId: string, url: string) {
    onUpdate(block.id, { children: children.map(c => c.id === childId ? { ...c, url } : c) })
  }
  function addChild() {
    const newChild = { id: generateId(), icon: '▸', translations: { es: { label: 'Opción', price: '' }, en: { label: 'Option', price: '' }, pt: { label: 'Opção', price: '' } } as any, url: '' }
    onUpdate(block.id, { children: [...children, newChild] })
  }
  function removeChild(id: string) {
    onUpdate(block.id, { children: children.filter(c => c.id !== id) })
  }

  return (
    <div className="space-y-4">
      <Section label="Cabecera">
        <Field label="Icono"><Input value={block.data.icon} onChange={v => onUpdate(block.id, { icon: v })} /></Field>
        <Field label="Título"><Input value={t.title} onChange={v => setT('title', v)} /></Field>
        <Field label="Subtítulo"><Input value={t.subtitle} onChange={v => setT('subtitle', v)} /></Field>
      </Section>
      <Section label={`Sub-opciones (${children.length})`}>
        {children.map((child, i) => {
          const ct = child.translations[lang] || child.translations['es'] || { label: '', price: '' }
          return (
            <div key={child.id} className="rounded-xl p-3 mb-2" style={{ background: '#F6F6F5' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: '#5A5D60' }}>Opción {i + 1}</span>
                <button onClick={() => removeChild(child.id)} className="text-xs" style={{ color: '#E8150A' }}>✕</button>
              </div>
              <Field label="Etiqueta"><Input value={ct.label || ''} onChange={v => updateChild(child.id, 'label', v)} /></Field>
              <Field label="Precio"><Input value={ct.price || ''} onChange={v => updateChild(child.id, 'price', v)} placeholder="desde 50 €" /></Field>
              <Field label="URL"><Input value={child.url} onChange={v => updateChildUrl(child.id, v)} placeholder="https://" /></Field>
            </div>
          )
        })}
        <button onClick={addChild} className="w-full py-2 text-xs font-semibold rounded-xl mt-1"
          style={{ background: '#FEF0EF', color: '#E8150A' }}>+ Añadir opción</button>
      </Section>
      <SeasonField value={block.seasonFilter} onChange={v => onUpdate(block.id, { seasonFilter: v } as any)} />
    </div>
  )
}

// ─── Section Label Editor ────────────────────────────────────────
function SectionLabelEditor({ block, lang, onUpdate }: { block: SectionLabelBlock; lang: Lang; onUpdate: (id: string, d: any) => void }) {
  const t = block.data.translations[lang] || block.data.translations['es'] || { text: '' }
  return (
    <div className="space-y-4">
      <Section label="Texto">
        <Field label="Etiqueta">
          <Input value={t.text} onChange={v => onUpdate(block.id, {
            translations: { ...block.data.translations, [lang]: { text: v } }
          })} placeholder="SECCIÓN" />
        </Field>
      </Section>
      <SeasonField value={block.seasonFilter} onChange={v => onUpdate(block.id, { seasonFilter: v } as any)} />
    </div>
  )
}

// ─── Text Editor ─────────────────────────────────────────────────
function TextEditor({ block, lang, onUpdate }: { block: TextBlock; lang: Lang; onUpdate: (id: string, d: any) => void }) {
  const t = block.data.translations[lang] || block.data.translations['es'] || { content: '' }
  return (
    <div className="space-y-4">
      <Section label="Contenido">
        <Field label="Texto">
          <textarea value={t.content} rows={5}
            onChange={e => onUpdate(block.id, { translations: { ...block.data.translations, [lang]: { content: e.target.value } } })}
            className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
            style={{ background: '#F6F6F5', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }} />
        </Field>
        <Field label="Alineación">
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map(a => (
              <button key={a} onClick={() => onUpdate(block.id, { align: a })}
                className="flex-1 py-1.5 text-xs rounded-lg font-medium"
                style={{ background: block.data.align === a ? '#E8150A' : '#F6F6F5', color: block.data.align === a ? '#fff' : '#5A5D60' }}>
                {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Tamaño">
          <div className="flex gap-1">
            {(['sm', 'md', 'lg'] as const).map(s => (
              <button key={s} onClick={() => onUpdate(block.id, { size: s })}
                className="flex-1 py-1.5 text-xs rounded-lg font-medium"
                style={{ background: block.data.size === s ? '#E8150A' : '#F6F6F5', color: block.data.size === s ? '#fff' : '#5A5D60' }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </Field>
      </Section>
    </div>
  )
}

// ─── Contact Card Editor ─────────────────────────────────────────
function ContactCardEditor({ block, onUpdate }: { block: ContactCardBlock; onUpdate: (id: string, d: any) => void }) {
  const d = block.data
  return (
    <div className="space-y-4">
      <Section label="Datos de contacto">
        <Field label="WhatsApp"><Input value={d.whatsapp || ''} onChange={v => onUpdate(block.id, { whatsapp: v })} placeholder="+34 600 000 000" /></Field>
        <Field label="Email"><Input value={d.email || ''} onChange={v => onUpdate(block.id, { email: v })} placeholder="hola@negocio.com" /></Field>
        <Field label="Teléfono"><Input value={d.phone || ''} onChange={v => onUpdate(block.id, { phone: v })} placeholder="+34 600 000 000" /></Field>
        <Field label="Dirección"><Input value={d.address || ''} onChange={v => onUpdate(block.id, { address: v })} placeholder="Calle, Ciudad" /></Field>
        <Field label="URL Mapa"><Input value={d.mapUrl || ''} onChange={v => onUpdate(block.id, { mapUrl: v })} placeholder="https://maps.google.com/..." /></Field>
      </Section>
    </div>
  )
}

// ─── Social Grid Editor ──────────────────────────────────────────
const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin', 'whatsapp'] as const

function SocialGridEditor({ block, onUpdate }: { block: SocialGridBlock; onUpdate: (id: string, d: any) => void }) {
  const items = block.data.items
  function updateItem(id: string, key: string, val: string) {
    onUpdate(block.id, { items: items.map(i => i.id === id ? { ...i, [key]: val } : i) })
  }
  function addItem() {
    onUpdate(block.id, { items: [...items, { id: generateId(), platform: 'instagram', url: 'https://instagram.com/', label: 'Instagram' }] })
  }
  function removeItem(id: string) {
    onUpdate(block.id, { items: items.filter(i => i.id !== id) })
  }
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="rounded-xl p-3" style={{ background: '#F6F6F5' }}>
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: '#5A5D60' }}>{item.platform}</span>
            <button onClick={() => removeItem(item.id)} className="text-xs" style={{ color: '#E8150A' }}>✕</button>
          </div>
          <Field label="Red">
            <select value={item.platform} onChange={e => updateItem(item.id, 'platform', e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: '#fff', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="URL"><Input value={item.url} onChange={v => updateItem(item.id, 'url', v)} /></Field>
          <Field label="Etiqueta"><Input value={item.label} onChange={v => updateItem(item.id, 'label', v)} /></Field>
        </div>
      ))}
      <button onClick={addItem} className="w-full py-2 text-xs font-semibold rounded-xl"
        style={{ background: '#FEF0EF', color: '#E8150A' }}>+ Añadir red social</button>
    </div>
  )
}

// ─── Divider Editor ──────────────────────────────────────────────
function DividerEditor({ block, onUpdate }: { block: Block; onUpdate: (id: string, d: any) => void }) {
  const b = block as any
  return (
    <div className="space-y-4">
      <Section label="Estilo">
        <Field label="Tipo">
          <div className="flex gap-1">
            {(['line', 'space'] as const).map(s => (
              <button key={s} onClick={() => onUpdate(block.id, { style: s })}
                className="flex-1 py-1.5 text-xs rounded-lg font-medium"
                style={{ background: b.data.style === s ? '#E8150A' : '#F6F6F5', color: b.data.style === s ? '#fff' : '#5A5D60' }}>
                {s === 'line' ? 'Línea' : 'Espacio'}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Espaciado">
          <div className="flex gap-1">
            {(['sm', 'md', 'lg'] as const).map(s => (
              <button key={s} onClick={() => onUpdate(block.id, { spacing: s })}
                className="flex-1 py-1.5 text-xs rounded-lg font-medium"
                style={{ background: b.data.spacing === s ? '#E8150A' : '#F6F6F5', color: b.data.spacing === s ? '#fff' : '#5A5D60' }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </Field>
      </Section>
    </div>
  )
}

// ─── Page Settings Editor ────────────────────────────────────────
function PageSettingsEditor({ settings, limits, onUpdate }: {
  settings: PageSettings
  limits: import('@/types').PlanLimits
  onUpdate: (s: Partial<PageSettings>) => void
}) {
  return (
    <div className="space-y-4">
      <Section label="Color principal">
        <div className="flex flex-wrap gap-2">
          {['#E8150A', '#FF8C00', '#185FA5', '#16A34A', '#7C3AED', '#1A1B1C', '#DB2777', '#0891B2'].map(c => (
            <button key={c} onClick={() => onUpdate({ primaryColor: c })}
              className="w-8 h-8 rounded-lg border-2 transition-all"
              style={{ background: c, borderColor: settings.primaryColor === c ? '#1A1B1C' : 'transparent' }} />
          ))}
        </div>
        <Field label="Color personalizado">
          <input type="color" value={settings.primaryColor}
            onChange={e => onUpdate({ primaryColor: e.target.value })}
            className="w-full h-9 rounded-xl cursor-pointer" style={{ border: '1.5px solid rgba(26,27,28,0.09)' }} />
        </Field>
      </Section>

      <Section label="Idiomas">
        {limits.multiLanguage ? (
          <div className="space-y-1.5">
            <Field label="Idioma por defecto">
              <select value={settings.defaultLang} onChange={e => onUpdate({ defaultLang: e.target.value as Lang })}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: '#F6F6F5', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }}>
                {ALL_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </Field>
            <p className="text-xs font-semibold mb-1" style={{ color: '#5A5D60' }}>Idiomas activos</p>
            {ALL_LANGS.map(l => (
              <label key={l.code} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  checked={settings.enabledLangs.includes(l.code)}
                  onChange={e => {
                    const langs = e.target.checked
                      ? [...settings.enabledLangs, l.code]
                      : settings.enabledLangs.filter(x => x !== l.code)
                    onUpdate({ enabledLangs: langs.length ? langs : [settings.defaultLang] })
                  }} />
                <span className="text-sm" style={{ color: '#1A1B1C' }}>{l.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <ProLock feature="Multiidioma" />
        )}
      </Section>

      <Section label="Temporada">
        {limits.seasonFilter ? (
          <Field label="Modo temporada">
            <select value={settings.seasonMode} onChange={e => onUpdate({ seasonMode: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: '#F6F6F5', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }}>
              <option value="always">Siempre activo</option>
              <option value="winter">❄️ Invierno</option>
              <option value="summer">☀️ Verano</option>
              <option value="off">⏸ Fuera de temporada</option>
            </select>
          </Field>
        ) : (
          <ProLock feature="Filtros de temporada" />
        )}
      </Section>

      <Section label="General">
        <Toggle label="Mostrar 'Creado con LinkHub'" value={settings.showPoweredBy}
          onChange={v => onUpdate({ showPoweredBy: v })} />
      </Section>
    </div>
  )
}

// ─── SEO Editor ──────────────────────────────────────────────────
function SeoEditor({ seo, onUpdate }: { seo: PageSettings['seo']; onUpdate: (s: Partial<PageSettings['seo']>) => void }) {
  return (
    <div className="space-y-4">
      <Section label="SEO & Metadatos">
        <Field label="Título SEO">
          <Input value={seo.title} onChange={v => onUpdate({ title: v })} placeholder="Nombre de tu negocio" />
          <p className="text-xs mt-1" style={{ color: '#9A9D9F' }}>{seo.title.length}/60 caracteres</p>
        </Field>
        <Field label="Descripción">
          <textarea value={seo.description} rows={3}
            onChange={e => onUpdate({ description: e.target.value })}
            placeholder="Breve descripción de tu negocio o página..."
            className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
            style={{ background: '#F6F6F5', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }} />
          <p className="text-xs mt-1" style={{ color: '#9A9D9F' }}>{seo.description.length}/160 caracteres</p>
        </Field>
        <Field label="Imagen OG (URL)">
          <Input value={seo.ogImage || ''} onChange={v => onUpdate({ ogImage: v || null })} placeholder="https://..." />
        </Field>
      </Section>
      <div className="rounded-xl p-3" style={{ background: '#F6F6F5' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#5A5D60' }}>Vista previa Google</p>
        <p className="text-sm font-medium" style={{ color: '#1a0dab' }}>{seo.title || 'Título de tu página'}</p>
        <p className="text-xs" style={{ color: '#006621' }}>linkhub.app/p/tu-slug</p>
        <p className="text-xs mt-0.5" style={{ color: '#545454' }}>{seo.description || 'Descripción de tu página...'}</p>
      </div>
    </div>
  )
}

// ─── Shared sub-components ───────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9A9D9F' }}>{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: '#5A5D60' }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
      style={{ background: '#F6F6F5', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }}
      onFocus={e => (e.target.style.borderColor = '#E8150A')}
      onBlur={e => (e.target.style.borderColor = 'rgba(26,27,28,0.09)')} />
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm" style={{ color: '#1A1B1C' }}>{label}</span>
      <div onClick={() => onChange(!value)}
        className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
        style={{ background: value ? '#E8150A' : '#E5E7EB' }}>
        <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow"
          style={{ left: value ? 18 : 2 }} />
      </div>
    </label>
  )
}

function SeasonField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Section label="Visibilidad por temporada">
      <Field label="Mostrar en">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: '#F6F6F5', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }}>
          <option value="always">Siempre</option>
          <option value="winter">❄️ Solo en invierno</option>
          <option value="summer">☀️ Solo en verano</option>
          <option value="off">⏸ Solo fuera de temporada</option>
        </select>
      </Field>
    </Section>
  )
}

function ProLock({ feature }: { feature: string }) {
  return (
    <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: '#FEF0EF', border: '1px solid #E8150A22' }}>
      <div className="text-xl">🔒</div>
      <div>
        <p className="text-xs font-semibold" style={{ color: '#E8150A' }}>{feature} · Plan Pro</p>
        <a href="/dashboard/upgrade" className="text-xs underline" style={{ color: '#B50F07' }}>Actualizar →</a>
      </div>
    </div>
  )
}
