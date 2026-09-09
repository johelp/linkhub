'use client'
import { useState } from 'react'
import { useEditorStore } from '@/hooks/useEditorStore'
import type { Plan, Lang, SeasonMode, Block, LinkBlock, FeaturedBlock, ExpandableBlock, SectionLabelBlock, TextBlock, ContactCardBlock, SocialGridBlock, DividerBlock, ImageBannerBlock, VideoEmbedBlock, EmailCaptureBlock, PaymentButtonBlock, EventTicketsBlock, BusinessHoursBlock, DaySchedule, PageSettings } from '@/types'
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
  const { page, selectedBlockId, updateBlock, updateBlockSeasonFilter, updateSettings, updateSeo, previewLang } = useEditorStore()
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
            ? <BlockEditor block={selectedBlock} lang={previewLang} plan={plan} onUpdate={updateBlock} onUpdateSeason={updateBlockSeasonFilter} />
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
function BlockEditor({ block, lang, plan, onUpdate, onUpdateSeason }: {
  block: Block; lang: Lang; plan: Plan
  onUpdate: (id: string, data: Partial<Block['data']>) => void
  onUpdateSeason: (id: string, seasonFilter: SeasonMode) => void
}) {
  const limits = PLAN_LIMITS[plan]

  switch (block.type) {
    case 'link': return <LinkEditor block={block} lang={lang} limits={limits} onUpdate={onUpdate} onUpdateSeason={onUpdateSeason} />
    case 'featured': return <FeaturedEditor block={block} lang={lang} onUpdate={onUpdate} onUpdateSeason={onUpdateSeason} />
    case 'expandable': return <ExpandableEditor block={block} lang={lang} onUpdate={onUpdate} onUpdateSeason={onUpdateSeason} />
    case 'section_label': return <SectionLabelEditor block={block} lang={lang} onUpdate={onUpdate} onUpdateSeason={onUpdateSeason} />
    case 'text': return <TextEditor block={block} lang={lang} onUpdate={onUpdate} />
    case 'contact_card': return <ContactCardEditor block={block} onUpdate={onUpdate} />
    case 'social_grid': return <SocialGridEditor block={block} onUpdate={onUpdate} />
    case 'divider': return <DividerEditor block={block} onUpdate={onUpdate} />
    case 'image_banner': return <ImageBannerEditor block={block} onUpdate={onUpdate} />
    case 'video_embed': return <VideoEmbedEditor block={block} onUpdate={onUpdate} />
    case 'email_capture': return <EmailCaptureEditor block={block} lang={lang} onUpdate={onUpdate} />
    case 'payment_button': return <PaymentButtonEditor block={block} lang={lang} onUpdate={onUpdate} />
    case 'event_tickets': return <EventTicketsEditor block={block} lang={lang} onUpdate={onUpdate} />
    case 'business_hours': return <BusinessHoursEditor block={block} lang={lang} onUpdate={onUpdate} />
    default: return <p className="text-xs" style={{ color: '#9A9D9F' }}>Sin opciones para este bloque.</p>
  }
}

// ─── Link Editor ─────────────────────────────────────────────────
function LinkEditor({ block, lang, limits, onUpdate, onUpdateSeason }: {
  block: LinkBlock; lang: Lang; limits: import('@/types').PlanLimits
  onUpdate: (id: string, d: Partial<LinkBlock['data']>) => void
  onUpdateSeason: (id: string, s: SeasonMode) => void
}) {
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
      {limits.seasonFilter && <SeasonField value={block.seasonFilter} onChange={v => onUpdateSeason(block.id, v)} />}
    </div>
  )
}

// ─── Featured Editor ─────────────────────────────────────────────
function FeaturedEditor({ block, lang, onUpdate, onUpdateSeason }: {
  block: FeaturedBlock; lang: Lang
  onUpdate: (id: string, d: Partial<FeaturedBlock['data']>) => void
  onUpdateSeason: (id: string, s: SeasonMode) => void
}) {
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
      <SeasonField value={block.seasonFilter} onChange={v => onUpdateSeason(block.id, v)} />
    </div>
  )
}

// ─── Expandable Editor ───────────────────────────────────────────
function ExpandableEditor({ block, lang, onUpdate, onUpdateSeason }: {
  block: ExpandableBlock; lang: Lang
  onUpdate: (id: string, d: Partial<ExpandableBlock['data']>) => void
  onUpdateSeason: (id: string, s: SeasonMode) => void
}) {
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
    const translations = Object.fromEntries(
      ALL_LANGS.map(l => [l.code, { label: 'Opción', price: '' }])
    ) as Record<Lang, { label: string; price?: string }>
    onUpdate(block.id, { children: [...children, { id: generateId(), icon: '▸', translations, url: '' }] })
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
      <SeasonField value={block.seasonFilter} onChange={v => onUpdateSeason(block.id, v)} />
    </div>
  )
}

// ─── Section Label Editor ────────────────────────────────────────
function SectionLabelEditor({ block, lang, onUpdate, onUpdateSeason }: {
  block: SectionLabelBlock; lang: Lang
  onUpdate: (id: string, d: Partial<SectionLabelBlock['data']>) => void
  onUpdateSeason: (id: string, s: SeasonMode) => void
}) {
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
      <SeasonField value={block.seasonFilter} onChange={v => onUpdateSeason(block.id, v)} />
    </div>
  )
}

// ─── Text Editor ─────────────────────────────────────────────────
function TextEditor({ block, lang, onUpdate }: { block: TextBlock; lang: Lang; onUpdate: (id: string, d: Partial<TextBlock['data']>) => void }) {
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
function ContactCardEditor({ block, onUpdate }: { block: ContactCardBlock; onUpdate: (id: string, d: Partial<ContactCardBlock['data']>) => void }) {
  const d = block.data
  return (
    <div className="space-y-4">
      <Section label="Datos de contacto">
        <Field label="WhatsApp"><Input value={d.whatsapp || ''} onChange={v => onUpdate(block.id, { whatsapp: v })} placeholder="+34 600 000 000" /></Field>
        {d.whatsapp && (
          <Field label="Mensaje predefinido de WhatsApp">
            <Input value={d.whatsappMessage || ''} onChange={v => onUpdate(block.id, { whatsappMessage: v })} placeholder="Hola, quería consultar por..." />
          </Field>
        )}
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

function SocialGridEditor({ block, onUpdate }: { block: SocialGridBlock; onUpdate: (id: string, d: Partial<SocialGridBlock['data']>) => void }) {
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
function DividerEditor({ block, onUpdate }: { block: DividerBlock; onUpdate: (id: string, d: Partial<DividerBlock['data']>) => void }) {
  return (
    <div className="space-y-4">
      <Section label="Estilo">
        <Field label="Tipo">
          <div className="flex gap-1">
            {(['line', 'space'] as const).map(s => (
              <button key={s} onClick={() => onUpdate(block.id, { style: s })}
                className="flex-1 py-1.5 text-xs rounded-lg font-medium"
                style={{ background: block.data.style === s ? '#E8150A' : '#F6F6F5', color: block.data.style === s ? '#fff' : '#5A5D60' }}>
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
                style={{ background: block.data.spacing === s ? '#E8150A' : '#F6F6F5', color: block.data.spacing === s ? '#fff' : '#5A5D60' }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </Field>
      </Section>
    </div>
  )
}

// ─── Image Banner Editor ─────────────────────────────────────────
function ImageBannerEditor({ block, onUpdate }: { block: ImageBannerBlock; onUpdate: (id: string, d: Partial<ImageBannerBlock['data']>) => void }) {
  return (
    <div className="space-y-4">
      <Section label="Imagen">
        <Field label="URL de la imagen">
          <Input value={block.data.imageUrl} onChange={v => onUpdate(block.id, { imageUrl: v })} placeholder="https://..." />
        </Field>
        <Field label="Texto alternativo">
          <Input value={block.data.altText} onChange={v => onUpdate(block.id, { altText: v })} placeholder="Descripción para accesibilidad" />
        </Field>
        <Field label="Enlace (opcional)">
          <Input value={block.data.url || ''} onChange={v => onUpdate(block.id, { url: v })} placeholder="https://" />
        </Field>
      </Section>
      <Section label="Proporción">
        <div className="flex gap-1">
          {(['16:9', '4:3', '1:1', '3:1'] as const).map(r => (
            <button key={r} onClick={() => onUpdate(block.id, { aspectRatio: r })}
              className="flex-1 py-1.5 text-xs rounded-lg font-medium"
              style={{ background: block.data.aspectRatio === r ? '#E8150A' : '#F6F6F5', color: block.data.aspectRatio === r ? '#fff' : '#5A5D60' }}>
              {r}
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ─── Video Embed Editor ──────────────────────────────────────────
function VideoEmbedEditor({ block, onUpdate }: { block: VideoEmbedBlock; onUpdate: (id: string, d: Partial<VideoEmbedBlock['data']>) => void }) {
  return (
    <div className="space-y-4">
      <Section label="Video">
        <Field label="URL de YouTube, Vimeo o archivo .mp4">
          <Input value={block.data.url} onChange={v => onUpdate(block.id, { url: v })} placeholder="https://youtube.com/watch?v=..." />
        </Field>
        <Field label="Leyenda (opcional)">
          <Input value={block.data.caption || ''} onChange={v => onUpdate(block.id, { caption: v })} placeholder="Un video corto de presentación" />
        </Field>
      </Section>
      <Section label="Proporción">
        <div className="flex gap-1">
          {([
            { v: '16:9' as const, label: '16:9 horizontal' },
            { v: '9:16' as const, label: '9:16 vertical' },
            { v: '1:1' as const, label: '1:1 cuadrado' },
          ]).map(r => (
            <button key={r.v} onClick={() => onUpdate(block.id, { aspectRatio: r.v })}
              className="flex-1 py-1.5 text-xs rounded-lg font-medium"
              style={{ background: block.data.aspectRatio === r.v ? '#E8150A' : '#F6F6F5', color: block.data.aspectRatio === r.v ? '#fff' : '#5A5D60' }}>
              {r.v}
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ─── Email Capture Editor ────────────────────────────────────────
function EmailCaptureEditor({ block, lang, onUpdate }: {
  block: EmailCaptureBlock; lang: Lang
  onUpdate: (id: string, d: Partial<EmailCaptureBlock['data']>) => void
}) {
  const t = block.data.translations[lang] || block.data.translations['es'] || { headline: '', description: '', buttonLabel: '' }
  const setT = (key: string, val: string) => onUpdate(block.id, {
    translations: { ...block.data.translations, [lang]: { ...t, [key]: val } }
  })
  return (
    <div className="space-y-4">
      <Section label="Textos">
        <Field label="Título"><Input value={t.headline} onChange={v => setT('headline', v)} placeholder="Sumate a la lista" /></Field>
        <Field label="Descripción"><Input value={t.description} onChange={v => setT('description', v)} placeholder="Opcional" /></Field>
        <Field label="Texto del botón"><Input value={t.buttonLabel} onChange={v => setT('buttonLabel', v)} placeholder="Enviar" /></Field>
      </Section>
      <p className="text-xs" style={{ color: '#9A9D9F' }}>Los emails capturados se descargan en CSV desde el dashboard de cada página.</p>
    </div>
  )
}

// ─── Payment Button Editor ────────────────────────────────────────
const MP_CURRENCIES = ['ARS', 'MXN', 'CLP', 'COP', 'PEN', 'UYU', 'BRL']

function PaymentButtonEditor({ block, lang, onUpdate }: {
  block: PaymentButtonBlock; lang: Lang
  onUpdate: (id: string, d: Partial<PaymentButtonBlock['data']>) => void
}) {
  const t = block.data.translations[lang] || block.data.translations['es'] || { title: '', description: '' }
  const setT = (key: string, val: string) => onUpdate(block.id, {
    translations: { ...block.data.translations, [lang]: { ...t, [key]: val } }
  })
  return (
    <div className="space-y-4">
      <Section label="Producto">
        <Field label="Título"><Input value={t.title} onChange={v => setT('title', v)} placeholder="Mi producto" /></Field>
        <Field label="Descripción"><Input value={t.description} onChange={v => setT('description', v)} placeholder="Opcional" /></Field>
      </Section>
      <Section label="Precio">
        <Field label="Monto">
          <input type="number" min="0" step="0.01" value={block.data.price}
            onChange={e => onUpdate(block.id, { price: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#F6F6F5', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }} />
        </Field>
        <Field label="Moneda">
          <select value={block.data.currency} onChange={e => onUpdate(block.id, { currency: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#F6F6F5', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }}>
            {MP_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </Section>
      <p className="text-xs" style={{ color: '#9A9D9F' }}>
        Necesitás conectar tu cuenta de Mercado Pago desde <a href="/dashboard/settings" className="underline">Ajustes</a> para que este bloque cobre de verdad.
      </p>
    </div>
  )
}

// ─── Event Tickets Editor ─────────────────────────────────────────
function EventTicketsEditor({ block, lang, onUpdate }: {
  block: EventTicketsBlock; lang: Lang
  onUpdate: (id: string, d: Partial<EventTicketsBlock['data']>) => void
}) {
  const t = block.data.translations[lang] || block.data.translations['es'] || { title: '', description: '' }
  const setT = (key: string, val: string) => onUpdate(block.id, {
    translations: { ...block.data.translations, [lang]: { ...t, [key]: val } }
  })
  const tiers = block.data.tiers

  function updateTier(id: string, patch: Partial<{ name: string; price: number }>) {
    onUpdate(block.id, { tiers: tiers.map(x => x.id === id ? { ...x, ...patch } : x) })
  }
  function addTier() {
    if (tiers.length >= 3) return
    onUpdate(block.id, { tiers: [...tiers, { id: generateId(), name: `Tipo ${tiers.length + 1}`, price: 0 }] })
  }
  function removeTier(id: string) {
    if (tiers.length <= 1) return
    onUpdate(block.id, { tiers: tiers.filter(x => x.id !== id) })
  }

  return (
    <div className="space-y-4">
      <Section label="Evento">
        <Field label="Título"><Input value={t.title} onChange={v => setT('title', v)} placeholder="Mi evento" /></Field>
        <Field label="Descripción"><Input value={t.description} onChange={v => setT('description', v)} placeholder="Opcional" /></Field>
      </Section>
      <Section label="Moneda">
        <select value={block.data.currency} onChange={e => onUpdate(block.id, { currency: e.target.value })}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: '#F6F6F5', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }}>
          {MP_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Section>
      <Section label={`Tipos de entrada (${tiers.length}/3)`}>
        {tiers.map((tier, i) => (
          <div key={tier.id} className="rounded-xl p-3 mb-2" style={{ background: '#F6F6F5' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: '#5A5D60' }}>Tipo {i + 1}</span>
              {tiers.length > 1 && (
                <button onClick={() => removeTier(tier.id)} className="text-xs" style={{ color: '#E8150A' }}>✕</button>
              )}
            </div>
            <Field label="Nombre"><Input value={tier.name} onChange={v => updateTier(tier.id, { name: v })} placeholder="General, VIP..." /></Field>
            <Field label="Precio">
              <input type="number" min="0" step="0.01" value={tier.price}
                onChange={e => updateTier(tier.id, { price: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: '#fff', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C', fontFamily: 'inherit' }} />
            </Field>
          </div>
        ))}
        {tiers.length < 3 && (
          <button onClick={addTier} className="w-full py-2 text-xs font-semibold rounded-xl"
            style={{ background: '#FEF0EF', color: '#E8150A' }}>+ Añadir tipo de entrada</button>
        )}
      </Section>
      <p className="text-xs" style={{ color: '#9A9D9F' }}>
        Necesitás conectar tu cuenta de Mercado Pago desde <a href="/dashboard/settings" className="underline">Ajustes</a>.
        Cada entrada vendida manda un email con QR de validación, y las podés validar en la puerta desde el ícono 🎫 del dashboard.
      </p>
    </div>
  )
}

// ─── Business Hours Editor ────────────────────────────────────────
const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // display Mon..Sun

function BusinessHoursEditor({ block, lang, onUpdate }: {
  block: BusinessHoursBlock; lang: Lang
  onUpdate: (id: string, d: Partial<BusinessHoursBlock['data']>) => void
}) {
  const t = block.data.translations[lang] || block.data.translations['es'] || { title: '' }
  const setT = (key: string, val: string) => onUpdate(block.id, {
    translations: { ...block.data.translations, [lang]: { ...t, [key]: val } }
  })

  function updateDay(day: number, patch: Partial<DaySchedule>) {
    onUpdate(block.id, {
      schedule: block.data.schedule.map(s => s.day === day ? { ...s, ...patch } : s),
    })
  }

  return (
    <div className="space-y-4">
      <Section label="Título">
        <Field label="Texto"><Input value={t.title} onChange={v => setT('title', v)} placeholder="Horario de atención" /></Field>
      </Section>
      <Section label="Zona horaria">
        <Input value={block.data.timezone} onChange={v => onUpdate(block.id, { timezone: v })} placeholder="America/Argentina/Buenos_Aires" />
        <p className="text-xs mt-1" style={{ color: '#9A9D9F' }}>Nombre de zona horaria IANA (ej. America/Argentina/Buenos_Aires, Europe/Madrid).</p>
      </Section>
      <Section label="Horario por día">
        {DAY_ORDER.map(day => {
          const d = block.data.schedule.find(s => s.day === day)
          if (!d) return null
          return (
            <div key={day} className="rounded-xl p-3 mb-2" style={{ background: '#F6F6F5' }}>
              <label className="flex items-center justify-between mb-2 cursor-pointer">
                <span className="text-xs font-semibold" style={{ color: '#1A1B1C' }}>{DAY_LABELS[day]}</span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: '#5A5D60' }}>
                  <input type="checkbox" checked={d.closed} onChange={e => updateDay(day, { closed: e.target.checked })} />
                  Cerrado
                </span>
              </label>
              {!d.closed && (
                <div className="flex items-center gap-2">
                  <input type="time" value={d.open} onChange={e => updateDay(day, { open: e.target.value })}
                    className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none"
                    style={{ background: '#fff', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C' }} />
                  <span style={{ color: '#9A9D9F' }}>—</span>
                  <input type="time" value={d.close} onChange={e => updateDay(day, { close: e.target.value })}
                    className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none"
                    style={{ background: '#fff', border: '1.5px solid rgba(26,27,28,0.09)', color: '#1A1B1C' }} />
                </div>
              )}
            </div>
          )
        })}
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
            <select value={settings.seasonMode} onChange={e => onUpdate({ seasonMode: e.target.value as SeasonMode })}
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

function SeasonField({ value, onChange }: { value: SeasonMode; onChange: (v: SeasonMode) => void }) {
  return (
    <Section label="Visibilidad por temporada">
      <Field label="Mostrar en">
        <select value={value} onChange={e => onChange(e.target.value as SeasonMode)}
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
