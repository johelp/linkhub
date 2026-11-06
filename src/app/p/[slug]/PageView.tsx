'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Page, Lang, Block, SeasonMode, LinkBlock, FeaturedBlock, ExpandableBlock, SectionLabelBlock, SocialGridBlock, ContactCardBlock, TextBlock, ImageBannerBlock, VideoEmbedBlock, EmailCaptureBlock, PaymentButtonBlock, EventTicketsBlock, BusinessHoursBlock, DaySchedule, GoogleReviewsBlock, LoyaltyCardBlock, MenuBlock, OrderMenuBlock, AppointmentRequestBlock } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { parseVideoEmbed, getBusinessOpenStatus, generateId } from '@/lib/utils'
import { normalizeBlock } from '@/lib/blocks/registry'
import { sanitizeBlocks } from '@/lib/security'
import { OrderMenu } from './OrderMenu'
import { AppointmentRequest } from './AppointmentRequest'

const ASPECT_RATIO: Record<string, number> = {
  '16:9': 16 / 9, '9:16': 9 / 16, '1:1': 1, '4:3': 4 / 3, '3:1': 3,
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '')
  return message?.trim()
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message.trim())}`
    : `https://wa.me/${digits}`
}

// Extra wiring used only by the editor canvas: which block is selected, how to
// select one, and how to act on it directly from the preview.
export interface EditingControls {
  lang: Lang
  selectedBlockId: string | null
  onSelect: (id: string | null) => void
  onInsertAt: (index: number) => void
  onMove: (id: string, dir: -1 | 1) => void
  onDuplicate: (id: string) => void
  onToggleVisibility: (id: string) => void
  onDelete: (id: string) => void
}

interface Props { page: Page; editing?: boolean; controls?: EditingControls }

const SOCIAL_ICONS: Record<string, string> = {
  instagram: '📷', facebook: '👥', tiktok: '🎵',
  youtube: '▶️', twitter: '𝕏', linkedin: '💼',
  whatsapp: '💬',
}

const SOCIAL_COLORS: Record<string, string> = {
  instagram: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
  facebook: '#1877f2', tiktok: '#010101',
  youtube: '#ff0000', twitter: '#000', linkedin: '#0077b5',
  whatsapp: '#25d366',
}

const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  not_configured: 'Este negocio todavía no configuró los pagos. Contactalo directamente para completar tu compra.',
  not_found: 'Ese producto o entrada ya no está disponible.',
  failed: 'No se pudo iniciar el pago. Intentá de nuevo en un momento.',
}

export function PageView({ page, editing = false, controls }: Props) {
  const [visitorLang, setLang] = useState<Lang>(page.settings.defaultLang)
  // In the editor the language is driven from outside, so the canvas always
  // shows the language whose fields the inspector is editing.
  const lang: Lang = controls?.lang ?? visitorLang
  const [season, setSeason] = useState<SeasonMode>(page.settings.seasonMode)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Read on mount from window.location rather than useSearchParams(): this
  // component renders inside a statically generated (ISR) page, and
  // useSearchParams() would force it into a Suspense-wrapped client-only
  // subtree just to show a one-off banner after a failed payment redirect.
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search)
    const err = qs.get('payment_error')
    if (qs.get('paid') === '1') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value (clock/URL/localStorage); reading it during render would break hydration
      setPaid(true)
      const u = new URL(window.location.href); u.searchParams.delete('paid'); window.history.replaceState(null, '', u.toString())
    }
    if (err) {
      setPaymentError(err)
      // Drop it from the URL so reloading/sharing the link doesn't re-show it.
      const url = new URL(window.location.href)
      url.searchParams.delete('payment_error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const pc = page.settings.primaryColor || '#E8150A'
  const bg = page.settings.backgroundColor || '#F6F6F5'

  // "Is business X open right now" depends on the viewer's clock, so it's computed
  // after mount only -- same reasoning as BusinessHoursCard below, to avoid a
  // server/client hydration mismatch. Conditional blocks stay hidden until this
  // resolves (a brief, one-time state, not a flicker on every render).
  const [businessStatus, setBusinessStatus] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const map: Record<string, boolean> = {}
    for (const b of page.blocks) {
      if (b.type === 'business_hours') map[b.id] = getBusinessOpenStatus(b.data.timezone, b.data.schedule).isOpen
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value (clock/URL/localStorage); reading it during render would break hydration
    setBusinessStatus(map)
  }, [page.blocks])

  // Track page view (skipped for the marketing-site demo mockup, which isn't a real page)
  useEffect(() => {
    if (editing || page.id.startsWith('demo')) return
    const supabase = createClient()
    const device = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
    supabase.from('analytics_events').insert({
      page_id: page.id,
      event_type: 'view',
      lang,
      device,
    }).then(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trackClick = useCallback((blockId: string, blockType: string, url: string) => {
    if (editing || page.id.startsWith('demo')) return
    const supabase = createClient()
    supabase.from('analytics_events').insert({
      page_id: page.id,
      event_type: 'click',
      block_id: blockId,
      block_type: blockType,
      url,
      lang,
    }).then(() => {})
  }, [page.id, lang, editing])

  // Filter blocks by season and by their conditional visibility (if any).
  // normalizeBlock upgrades any block left over from a retired type (e.g.
  // `menu_pdf`, renamed to `menu`) so an old page doesn't just silently
  // drop that block on the public page -- see registry.ts.
  // The editor canvas shows every block (hidden / seasonal / conditional ones
  // dimmed and tagged) so nothing the owner built ever "disappears" from view.
  const visibleBlocks = sanitizeBlocks(page.blocks.map(normalizeBlock))
    .filter(b => editing || b.visible)
    .filter(b => editing || b.seasonFilter === 'always' || b.seasonFilter === season || season === 'always')
    .filter(b => {
      if (editing || !b.condition) return true
      const isOpen = businessStatus[b.condition.sourceBlockId]
      if (isOpen === undefined) return false
      return b.condition.when === 'open' ? isOpen : !isOpen
    })
    .sort((a, b) => a.order - b.order)

  const enabledLangs = page.settings.enabledLangs || ['es']
  const showLangBar = enabledLangs.length > 1

  const profile = page.settings.profile
  const initial = (page.name.trim()[0] || '•').toUpperCase()
  // Simple link cards sit two-per-row on wide layouts; everything richer
  // (menus, stores, video, accordions...) spans the full row.
  const SINGLE_CELL: Block['type'][] = ['link']

  const langBar = showLangBar && !editing && (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
      {enabledLangs.map((l: Lang) => (
        <button key={l} onClick={() => setLang(l)}
          style={{
            fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
            border: `1px solid ${l === lang ? pc : 'rgba(26,27,28,0.15)'}`,
            background: l === lang ? pc : 'rgba(255,255,255,0.7)',
            color: l === lang ? '#fff' : '#5A5D60',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.3px',
          }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )

  return (
    // `@container`: the layout reacts to the width of THIS box, not the
    // browser window, so the editor's phone/tablet/desktop preview frames and
    // the real public page share one set of rules.
    <div className="@container lh-root" style={{ background: bg, minHeight: editing ? 420 : '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Soft brand glow behind everything -- gives wide screens depth instead of a flat grey field */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(900px 420px at 15% -5%, ${pc}26, transparent 70%), radial-gradient(700px 380px at 95% 0%, ${pc}14, transparent 65%)`,
      }} />

      <div className="relative mx-auto w-full max-w-[520px] px-4 pb-16 @2xl:max-w-[720px] @2xl:px-8 @4xl:grid @4xl:max-w-[1120px] @4xl:grid-cols-[340px_minmax(0,1fr)] @4xl:items-start @4xl:gap-14 @4xl:px-10 @4xl:pt-14 @4xl:pb-24">

        {/* Hero / profile: stacked on top for phones & tablets, sticky left panel on desktop */}
        <header className="pt-5 @4xl:sticky @4xl:top-10 @4xl:pt-0">
          <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', border: '1px solid rgba(26,27,28,0.08)', boxShadow: '0 10px 30px rgba(26,27,28,0.07)' }}>
            <div className="h-28 @2xl:h-36 @4xl:h-44" style={{
              background: profile?.coverUrl
                ? `center / cover no-repeat url("${profile.coverUrl.replace(/"/g, '%22')}")`
                : `linear-gradient(135deg, ${pc}, ${pc}99 55%, ${pc}55)`,
            }} />
            <div style={{ padding: '0 20px 22px', textAlign: 'center' }}>
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" width={88} height={88}
                  style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', marginTop: -44, background: '#fff', boxShadow: '0 4px 14px rgba(26,27,28,0.15)' }} />
              ) : (
                <div aria-hidden style={{
                  width: 88, height: 88, borderRadius: '50%', margin: '-44px auto 0', border: '4px solid #fff', background: pc, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 700, boxShadow: '0 4px 14px rgba(26,27,28,0.15)',
                }}>{initial}</div>
              )}
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1B1C', marginTop: 12, letterSpacing: '-0.3px', lineHeight: 1.2 }}>{page.name}</h1>
              {profile?.tagline && <p style={{ fontSize: 14, color: '#5A5D60', marginTop: 6, lineHeight: 1.5 }}>{profile.tagline}</p>}
              {langBar && <div style={{ marginTop: 14 }}>{langBar}</div>}
            </div>
          </div>

          {/* Season admin (only if page has season blocks) */}
          {page.settings.seasonMode !== 'always' && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0', gap: 4 }}>
              {(['winter','summer','off'] as SeasonMode[]).map(s => (
                <button key={s} onClick={() => setSeason(s)}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20,
                    border: `1px solid ${s === season ? pc : 'rgba(26,27,28,0.15)'}`,
                    background: s === season ? pc : 'rgba(255,255,255,0.7)',
                    color: s === season ? '#fff' : '#5A5D60', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  {s === 'winter' ? '❄️' : s === 'summer' ? '☀️' : '⏸'}
                </button>
              ))}
            </div>
          )}

          {page.settings.showPoweredBy && (
            <div className="hidden @4xl:block" style={{ textAlign: 'center', marginTop: 18 }}>
              <a href="https://linkhub.app" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#9A9D9F', textDecoration: 'none' }}>
                Creado con LinkHub
              </a>
            </div>
          )}
        </header>

        <main className="min-w-0">
          {paid && (
            <div role="status" style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: '#ECFDF3', border: '1px solid #BBF7D0', display: 'flex', gap: 10, alignItems: 'center' }}>
              <p style={{ fontSize: 13, color: '#14532D', lineHeight: 1.5, flex: 1 }}>¡Gracias por tu compra! Si compraste entradas, te llegan por email en unos minutos.</p>
              <button onClick={() => setPaid(false)} aria-label="Cerrar" style={{ border: 'none', background: 'none', color: '#14532D', fontSize: 14, cursor: 'pointer', padding: 2 }}>✕</button>
            </div>
          )}

          {/* Payment error banner (after a failed /api/pay/mercadopago redirect) */}
          {paymentError && (
            <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: '#FEF0EF', border: '1px solid rgba(232,21,10,0.25)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <p style={{ fontSize: 12.5, color: '#1A1B1C', lineHeight: 1.5, flex: 1 }}>
                {PAYMENT_ERROR_MESSAGES[paymentError] || PAYMENT_ERROR_MESSAGES.failed}
              </p>
              <button onClick={() => setPaymentError(null)} aria-label="Cerrar"
                style={{ border: 'none', background: 'none', color: '#9A9D9F', fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: 2 }}>✕</button>
            </div>
          )}

          {/* Blocks: 1 column on phones, 2-up grid from tablet width */}
          <div className="mt-4 grid grid-cols-1 gap-x-3 @2xl:grid-cols-2 @4xl:mt-0 @4xl:gap-x-4">
            {editing && controls && (
              <div className="@2xl:col-span-2"><InsertSlot index={0} onInsertAt={controls.onInsertAt} alwaysVisible={visibleBlocks.length === 0} /></div>
            )}
            {visibleBlocks.map((block, i) => {
              const cell = SINGLE_CELL.includes(block.type) ? 'lh-cell' : 'lh-cell @2xl:col-span-2'
              const rendered = (
                <BlockRenderer
                  block={block}
                  lang={lang}
                  pc={pc}
                  pageId={page.id}
                  pageName={page.name}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  onTrackClick={trackClick}
                  editing={editing}
                />
              )
              if (!editing || !controls) return <div key={block.id} className={cell}>{rendered}</div>
              return (
                <div key={block.id} className={cell}>
                  <SelectableBlock block={block} index={i} total={visibleBlocks.length} controls={controls}>
                    {rendered}
                  </SelectableBlock>
                  <InsertSlot index={i + 1} onInsertAt={controls.onInsertAt} />
                </div>
              )
            })}
          </div>

          {/* Powered by (phones & tablets; on desktop it lives under the profile card) */}
          {page.settings.showPoweredBy && (
            <div className="@4xl:hidden" style={{ textAlign: 'center', marginTop: 32 }}>
              <a href="https://linkhub.app" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#9A9D9F', textDecoration: 'none' }}>
                Creado con LinkHub
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── Editor-only: selectable wrapper + insertion slots ───────────
const TOOL_BTN: React.CSSProperties = {
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', background: 'transparent', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
}

function SelectableBlock({ block, index, total, controls, children }: {
  block: Block; index: number; total: number; controls: EditingControls; children: React.ReactNode
}) {
  const [hover, setHover] = useState(false)
  const selected = controls.selectedBlockId === block.id
  const tags = [
    !block.visible && 'Oculto',
    block.seasonFilter !== 'always' && `Solo ${block.seasonFilter === 'winter' ? 'invierno' : block.seasonFilter === 'summer' ? 'verano' : 'fuera de temporada'}`,
    block.condition && (block.condition.when === 'open' ? 'Solo si está abierto' : 'Solo si está cerrado'),
  ].filter(Boolean) as string[]

  const tool = (label: string, onClick: () => void, content: React.ReactNode, disabled = false) => (
    <button type="button" aria-label={label} title={label} disabled={disabled}
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{ ...TOOL_BTN, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer' }}>
      {content}
    </button>
  )

  return (
    <div
      role="button" tabIndex={0} aria-pressed={selected}
      aria-label={`Seleccionar bloque ${index + 1}`}
      data-block-id={block.id}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      // Capture phase: the click is consumed here, so links, accordions and
      // payment buttons inside the preview never fire while editing.
      onClickCapture={e => { e.preventDefault(); e.stopPropagation(); controls.onSelect(block.id) }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); controls.onSelect(block.id) } }}
      style={{
        position: 'relative', borderRadius: 16, cursor: 'pointer', outlineOffset: 2,
        outline: selected ? '2px solid #E8150A' : hover ? '2px solid rgba(232,21,10,0.35)' : '2px solid transparent',
        opacity: block.visible ? 1 : 0.45, transition: 'outline-color .12s',
      }}>
      <div style={{ pointerEvents: 'none' }}>{children}</div>

      {tags.length > 0 && (
        <div style={{ position: 'absolute', left: 6, top: 6, display: 'flex', gap: 4, pointerEvents: 'none' }}>
          {tags.map(t => (
            <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(26,27,28,0.82)', color: '#fff' }}>{t}</span>
          ))}
        </div>
      )}

      {selected && (
        <div style={{
          position: 'absolute', right: 6, top: -38, zIndex: 5, display: 'flex', gap: 2, padding: 3,
          background: '#1A1B1C', borderRadius: 11, boxShadow: '0 4px 14px rgba(26,27,28,0.3)',
        }} onClickCapture={e => e.stopPropagation()}>
          {tool('Subir', () => controls.onMove(block.id, -1), '↑', index === 0)}
          {tool('Bajar', () => controls.onMove(block.id, 1), '↓', index === total - 1)}
          {tool('Duplicar', () => controls.onDuplicate(block.id), '⧉')}
          {tool(block.visible ? 'Ocultar' : 'Mostrar', () => controls.onToggleVisibility(block.id), block.visible ? '◉' : '○')}
          {tool('Eliminar', () => controls.onDelete(block.id), '🗑')}
        </div>
      )}
    </div>
  )
}

function InsertSlot({ index, onInsertAt, alwaysVisible }: { index: number; onInsertAt: (i: number) => void; alwaysVisible?: boolean }) {
  const [hover, setHover] = useState(false)
  const show = hover || alwaysVisible
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ height: show ? 30 : 12, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'height .12s' }}>
      <button type="button" aria-label="Añadir bloque aquí" onClick={() => onInsertAt(index)}
        style={{
          opacity: show ? 1 : 0, transition: 'opacity .12s', display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 20, border: '1.5px dashed #E8150A', background: '#FEF0EF',
          color: '#E8150A', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
        + Añadir bloque
      </button>
    </div>
  )
}

// Shown in the editor preview instead of rendering nothing, for blocks that
// need a field filled in (image/video/PDF url) before they have anything to
// show on the real public page.
function EmptyBlockPlaceholder({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '28px 14px', marginBottom: 8, borderRadius: 14,
      border: '1.5px dashed rgba(26,27,28,0.15)', background: '#F6F6F5',
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 12, color: '#9A9D9F', textAlign: 'center' }}>{label}</span>
    </div>
  )
}

// ─── Block Renderer ──────────────────────────────────────────────
function BlockRenderer({ block, lang, pc, pageId, pageName, expandedId, setExpandedId, onTrackClick, editing }: {
  block: Block; lang: Lang; pc: string; pageId: string; pageName: string
  expandedId: string | null; setExpandedId: (id: string | null) => void
  onTrackClick: (id: string, type: string, url: string) => void
  editing: boolean
}) {
  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid rgba(26,27,28,0.09)',
    borderRadius: 14, marginBottom: 8, textDecoration: 'none',
    display: 'flex', alignItems: 'center', color: '#1A1B1C',
    gap: 12, padding: '12px 14px', cursor: 'pointer',
    transition: 'all .15s',
  }

  switch (block.type) {

    case 'section_label': {
      const b = block as SectionLabelBlock
      return (
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9A9D9F', margin: '22px 0 8px 2px', letterSpacing: '.8px', textTransform: 'uppercase' }}>
          {b.data.translations[lang]?.text || b.data.translations['es']?.text || ''}
        </div>
      )
    }

    case 'divider': {
      const b = block as typeof block & { type: 'divider'; data: { style: string; spacing: string } }
      const sp = b.data.spacing === 'sm' ? 8 : b.data.spacing === 'lg' ? 24 : 16
      return <div style={{ margin: `${sp}px 0`, borderTop: b.data.style === 'line' ? '1px solid rgba(26,27,28,0.09)' : 'none' }}/>
    }

    case 'link': {
      const b = block as LinkBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { title: '', description: '' }
      const iconBgs: Record<string, string> = {
        red: '#FEF0EF', orange: '#FFF4E6', blue: '#EAF2FB',
        green: '#ECFDF5', purple: '#F0ECFF', gray: '#F2F3F4', dark: '#1A1B1C',
      }
      const bgColor = iconBgs[b.data.iconBg] || b.data.iconBg || '#FEF0EF'
      return (
        <a href={b.data.url} target={b.data.openInNewTab ? '_blank' : '_self'} rel="noopener noreferrer"
          onClick={() => onTrackClick(b.id, 'link', b.data.url)}
          style={card}>
          <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>
            {b.data.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1B1C' }}>{t.title}</div>
            {t.description && <div style={{ fontSize: 12, color: '#9A9D9F', marginTop: 2 }}>{t.description}</div>}
          </div>
          <div style={{ fontSize: 13, color: '#9A9D9F' }}>→</div>
        </a>
      )
    }

    case 'appointment_request': {
      const b = block as AppointmentRequestBlock
      return <AppointmentRequest block={b} lang={lang} pc={pc} pageName={pageName} editing={editing}
        onSent={url => onTrackClick(b.id, 'appointment_request', url)} />
    }

    case 'order_menu': {
      const b = block as OrderMenuBlock
      return <OrderMenu block={b} lang={lang} pc={pc} pageName={pageName} editing={editing}
        onSent={url => onTrackClick(b.id, 'order_menu', url)} />
    }

    case 'menu': {
      const b = block as MenuBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { title: '', description: '' }
      const sections = b.data.sections.filter(s => s.items.length > 0)
      if (sections.length === 0 && !b.data.pdfUrl) {
        return editing ? <EmptyBlockPlaceholder icon="📋" label="Agregá categorías y productos, o un link a tu PDF" /> : null
      }
      return (
        <div style={{ background: '#fff', border: '1px solid rgba(26,27,28,0.09)', borderRadius: 14, marginBottom: 8, padding: '14px 16px' }}>
          {(t.title || t.description) && (
            <div style={{ marginBottom: 10 }}>
              {t.title && <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1B1C' }}>{t.title}</div>}
              {t.description && <div style={{ fontSize: 12, color: '#9A9D9F', marginTop: 2 }}>{t.description}</div>}
            </div>
          )}
          {sections.map(section => {
            const st = section.translations[lang] || section.translations['es'] || { name: '' }
            return (
              <div key={section.id} style={{ marginBottom: 10 }}>
                {st.name && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9A9D9F', letterSpacing: '.6px', textTransform: 'uppercase', marginBottom: 4 }}>
                    {st.name}
                  </div>
                )}
                {section.items.map(item => {
                  const it = item.translations[lang] || item.translations['es'] || { name: '', description: '' }
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(26,27,28,0.06)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1B1C' }}>{it.name}</div>
                        {it.description && <div style={{ fontSize: 11, color: '#9A9D9F', marginTop: 2 }}>{it.description}</div>}
                      </div>
                      {item.price && <div style={{ fontSize: 13, fontWeight: 700, color: pc, flexShrink: 0 }}>{item.price}</div>}
                    </div>
                  )
                })}
              </div>
            )
          })}
          {b.data.pdfUrl && (
            <a href={b.data.pdfUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => onTrackClick(b.id, 'menu', b.data.pdfUrl!)}
              style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 600, color: pc, marginTop: sections.length > 0 ? 8 : 0, textDecoration: 'none' }}>
              Ver carta completa (PDF) →
            </a>
          )}
        </div>
      )
    }

    case 'featured': {
      const b = block as FeaturedBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { title: '', description: '' }
      const badge = b.data.badge[lang] || b.data.badge['es'] || ''
      const schemeColors: Record<string, string> = { red: '#E8150A', orange: '#FF8C00', blue: '#185FA5', green: '#16A34A', purple: '#7C3AED', dark: '#1A1B1C' }
      const bgC = schemeColors[b.data.colorScheme] || b.data.customColor || '#FF8C00'
      return (
        <a href={b.data.url} target="_blank" rel="noopener noreferrer"
          onClick={() => onTrackClick(b.id, 'featured', b.data.url)}
          style={{ ...card, background: bgC, border: 'none', padding: '18px 16px', alignItems: 'center' }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>{b.data.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {badge && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.3)', color: '#fff', padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginBottom: 5 }}>{badge}</div>}
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 3 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{t.description}</div>
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>→</div>
        </a>
      )
    }

    case 'expandable': {
      const b = block as ExpandableBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { title: '', subtitle: '' }
      const isOpen = expandedId === b.id
      return (
        <div style={{ background: '#fff', border: `1px solid ${isOpen ? pc : 'rgba(26,27,28,0.09)'}`, borderRadius: 14, marginBottom: 8, overflow: 'hidden' }}>
          <div onClick={() => setExpandedId(isOpen ? null : b.id)}
            style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', cursor: 'pointer', gap: 12 }}>
            <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: '#FEF0EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>
              {b.data.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1B1C' }}>{t.title}</div>
              <div style={{ fontSize: 12, color: '#9A9D9F', marginTop: 2 }}>{t.subtitle}</div>
            </div>
            <div style={{ fontSize: 11, color: '#9A9D9F', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</div>
          </div>
          {isOpen && (
            <div style={{ borderTop: '1px solid rgba(26,27,28,0.09)', padding: 11, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {b.data.children.map(child => {
                const ct = child.translations[lang] || child.translations['es'] || { label: '' }
                return (
                  <a key={child.id} href={child.url} target="_blank" rel="noopener noreferrer"
                    onClick={() => onTrackClick(b.id, 'expandable', child.url)}
                    style={{ flex: '1 1 calc(50% - 4px)', border: '1.5px solid rgba(26,27,28,0.09)', borderRadius: 10, padding: '11px 8px', textAlign: 'center', textDecoration: 'none', background: '#F6F6F5', display: 'block' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1B1C' }}>{ct.label}</div>
                    {ct.price && <div style={{ fontSize: 11, color: pc, marginTop: 2, fontWeight: 600 }}>{ct.price}</div>}
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    case 'social_grid': {
      const b = block as SocialGridBlock
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {b.data.items.map(item => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              onClick={() => onTrackClick(b.id, 'social_grid', item.url)}
              style={{ ...card, flex: '1 1 calc(50% - 4px)', margin: 0, justifyContent: 'flex-start' }}>
              <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: SOCIAL_COLORS[item.platform] || '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {SOCIAL_ICONS[item.platform] || '🔗'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1B1C' }}>{item.label}</div>
            </a>
          ))}
        </div>
      )
    }

    case 'contact_card': {
      const b = block as ContactCardBlock
      const items = [
        b.data.whatsapp && { icon: '💬', label: 'WhatsApp', href: buildWhatsAppUrl(b.data.whatsapp, b.data.whatsappMessage) },
        b.data.email && { icon: '✉️', label: b.data.email, href: `mailto:${b.data.email}` },
        b.data.phone && { icon: '📞', label: b.data.phone, href: `tel:${b.data.phone}` },
        b.data.address && { icon: '📍', label: b.data.address, href: b.data.mapUrl || '#' },
      ].filter(Boolean) as { icon: string; label: string; href: string }[]
      return (
        <div style={{ marginBottom: 8 }}>
          {items.map((item, i) => (
            <a key={i} href={item.href} target="_blank" rel="noopener noreferrer"
              onClick={() => onTrackClick(b.id, 'contact_card', item.href)}
              style={{ ...card, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: '#F2F3F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>
                {item.icon}
              </div>
              <div style={{ fontSize: 13, color: '#1A1B1C' }}>{item.label}</div>
            </a>
          ))}
        </div>
      )
    }

    case 'text': {
      const b = block as TextBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { content: '' }
      const sizes: Record<string, string> = { sm: '12px', md: '14px', lg: '16px' }
      return (
        <p style={{ fontSize: sizes[b.data.size] || '14px', color: '#5A5D60', textAlign: b.data.align, marginBottom: 12, lineHeight: 1.6 }}>
          {t.content}
        </p>
      )
    }

    case 'image_banner': {
      const b = block as ImageBannerBlock
      const ratio = ASPECT_RATIO[b.data.aspectRatio] || 16 / 9
      if (!b.data.imageUrl) return editing ? <EmptyBlockPlaceholder icon="🖼️" label="Subí o pegá el link de una imagen" /> : null
      const frame = (
        <div style={{ position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: 14, overflow: 'hidden', marginBottom: 8, background: '#F2F3F4' }}>
          <Image src={b.data.imageUrl} alt={b.data.altText || ''} fill unoptimized style={{ objectFit: 'cover' }} />
        </div>
      )
      if (!b.data.url) return frame
      return (
        <a href={b.data.url} target="_blank" rel="noopener noreferrer"
          onClick={() => onTrackClick(b.id, 'image_banner', b.data.url!)} style={{ display: 'block' }}>
          {frame}
        </a>
      )
    }

    case 'video_embed': {
      const b = block as VideoEmbedBlock
      const embed = parseVideoEmbed(b.data.url)
      const ratio = ASPECT_RATIO[b.data.aspectRatio] || 16 / 9
      if (!embed.embedUrl) return editing ? <EmptyBlockPlaceholder icon="🎬" label="Pegá un link de YouTube, Vimeo o un video .mp4" /> : null
      return (
        <div style={{ marginBottom: 8 }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: 14, overflow: 'hidden', background: '#000' }}>
            {embed.kind === 'file' ? (
              <video src={embed.embedUrl} controls style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <iframe src={embed.embedUrl} title={b.data.caption || 'Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
            )}
          </div>
          {b.data.caption && <p style={{ fontSize: 12, color: '#9A9D9F', marginTop: 6, textAlign: 'center' }}>{b.data.caption}</p>}
        </div>
      )
    }

    case 'email_capture': {
      const b = block as EmailCaptureBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { headline: '', description: '', buttonLabel: '' }
      return <EmailCaptureForm pageId={pageId} lang={lang} pc={pc} headline={t.headline} description={t.description} buttonLabel={t.buttonLabel || 'Enviar'} />
    }

    case 'payment_button': {
      const b = block as PaymentButtonBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { title: '', description: '' }
      return (
        <a href={`/api/pay?pageId=${pageId}&blockId=${b.id}`}
          style={{ ...card, background: pc, border: 'none', color: '#fff' }}>
          <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>
            💳
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t.title}</div>
            {t.description && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{t.description}</div>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{formatMoney(b.data.price, b.data.currency)}</div>
        </a>
      )
    }

    case 'event_tickets': {
      const b = block as EventTicketsBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { title: '', description: '' }
      return (
        <div style={{ marginBottom: 8 }}>
          {(t.title || t.description) && (
            <div style={{ marginBottom: 8 }}>
              {t.title && <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1B1C' }}>{t.title}</div>}
              {t.description && <div style={{ fontSize: 12, color: '#9A9D9F', marginTop: 2 }}>{t.description}</div>}
            </div>
          )}
          {b.data.tiers.map(tier => (
            <a key={tier.id} href={`/api/pay?pageId=${pageId}&blockId=${b.id}&tierId=${tier.id}`}
              style={{ ...card, background: pc, border: 'none', color: '#fff', marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>
                🎫
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600 }}>{tier.name}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{formatMoney(tier.price, b.data.currency)}</div>
            </a>
          ))}
        </div>
      )
    }

    case 'business_hours': {
      const b = block as BusinessHoursBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { title: '' }
      return <BusinessHoursCard title={t.title} timezone={b.data.timezone} schedule={b.data.schedule} pc={pc} />
    }

    case 'google_reviews': {
      const b = block as GoogleReviewsBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { title: '' }
      const fullStars = Math.round(b.data.rating)
      const writeReviewUrl = b.data.placeId
        ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(b.data.placeId)}`
        : null
      return (
        <div style={{ background: '#fff', border: '1px solid rgba(26,27,28,0.09)', borderRadius: 14, marginBottom: 8, padding: '14px 16px' }}>
          {t.title && <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1B1C', marginBottom: 8 }}>{t.title}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16, letterSpacing: 1 }}>
              {'★'.repeat(fullStars)}<span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - fullStars)}</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1B1C' }}>{b.data.rating.toFixed(1)}</span>
            {b.data.reviewCount > 0 && <span style={{ fontSize: 12, color: '#9A9D9F' }}>({b.data.reviewCount} reseñas)</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {b.data.mapsUrl && (
              <a href={b.data.mapsUrl} target="_blank" rel="noopener noreferrer"
                onClick={() => onTrackClick(b.id, 'google_reviews', b.data.mapsUrl!)}
                style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, padding: '9px 0', borderRadius: 10, background: '#F6F6F5', color: '#1A1B1C', textDecoration: 'none' }}>
                Ver en Google
              </a>
            )}
            {writeReviewUrl && (
              <a href={writeReviewUrl} target="_blank" rel="noopener noreferrer"
                onClick={() => onTrackClick(b.id, 'google_reviews', writeReviewUrl)}
                style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, padding: '9px 0', borderRadius: 10, background: pc, color: '#fff', textDecoration: 'none' }}>
                Dejar reseña
              </a>
            )}
          </div>
        </div>
      )
    }

    case 'loyalty_card': {
      const b = block as LoyaltyCardBlock
      const t = b.data.translations[lang] || b.data.translations['es'] || { title: '', description: '' }
      return (
        <LoyaltyCardWidget pageId={pageId} blockId={b.id} pc={pc}
          title={t.title} description={t.description}
          stampIcon={b.data.stampIcon} targetStamps={b.data.targetStamps}
          rewardDescription={b.data.rewardDescription[lang] || b.data.rewardDescription.es || ''} />
      )
    }

    default:
      return null
  }
}

// ─── Email Capture Form ───────────────────────────────────────────
function EmailCaptureForm({ pageId, lang, pc, headline, description, buttonLabel }: {
  pageId: string; lang: Lang; pc: string; headline: string; description: string; buttonLabel: string
}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || status === 'loading') return
    if (pageId === 'demo') { setStatus('done'); return }
    setStatus('loading')
    const supabase = createClient()
    const { error } = await supabase.from('email_subscribers').insert({ page_id: pageId, email: email.trim(), lang })
    setStatus(error ? 'error' : 'done')
  }

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(26,27,28,0.09)', borderRadius: 14, marginBottom: 8, padding: '16px 14px', textAlign: 'center' }}>
      {status === 'done' ? (
        <p style={{ fontSize: 13, fontWeight: 600, color: pc }}>✓ ¡Gracias! Ya estás en la lista.</p>
      ) : (
        <form onSubmit={submit}>
          {headline && <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1B1C', marginBottom: 4 }}>{headline}</p>}
          {description && <p style={{ fontSize: 12, color: '#9A9D9F', marginBottom: 12 }}>{description}</p>}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(26,27,28,0.12)', fontSize: 13, color: '#1A1B1C', outline: 'none', fontFamily: 'inherit' }}
            />
            <button type="submit" disabled={status === 'loading'}
              style={{ flexShrink: 0, padding: '10px 16px', borderRadius: 10, border: 'none', background: pc, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: status === 'loading' ? 0.6 : 1 }}>
              {buttonLabel}
            </button>
          </div>
          {status === 'error' && <p style={{ fontSize: 11, color: '#E8150A', marginTop: 6 }}>Algo salió mal, probá de nuevo.</p>}
        </form>
      )}
    </div>
  )
}

// ─── Loyalty Card Widget ───────────────────────────────────────────
function LoyaltyCardWidget({ pageId, blockId, pc, title, description, stampIcon, targetStamps, rewardDescription }: {
  pageId: string; blockId: string; pc: string
  title: string; description: string; stampIcon: string; targetStamps: number; rewardDescription: string
}) {
  const isDemo = pageId.startsWith('demo')
  const storageKey = `linkhub_loyalty_${pageId}_${blockId}`
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value (clock/URL/localStorage); reading it during render would break hydration
      setCode(localStorage.getItem(storageKey))
    } catch {
      // Private browsing / blocked storage -- just can't remember the card, no big deal.
    }
  }, [storageKey])

  async function getCard() {
    if (loading || isDemo) return
    setLoading(true)
    setError(null)
    const newCode = generateId()
    const supabase = createClient()
    const { error: insertError } = await supabase.from('loyalty_cards').insert({ page_id: pageId, block_id: blockId, code: newCode })
    if (insertError) {
      // Most likely cause in practice: the `loyalty_cards` table/policies
      // from migration 009 haven't been run yet against this Supabase
      // project -- surface *something* instead of the button silently
      // resetting, which looks exactly like "no pasa nada" to a visitor.
      console.error('loyalty_cards insert failed', insertError)
      setLoading(false)
      setError('No se pudo crear tu tarjeta. Probá de nuevo en un momento.')
      return
    }
    try { localStorage.setItem(storageKey, newCode) } catch { /* see above */ }
    router.push(`/l/${newCode}`)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(26,27,28,0.09)', borderRadius: 14, marginBottom: 8, padding: '16px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{stampIcon}</div>
      {title && <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1B1C', marginBottom: 4 }}>{title}</p>}
      {description && <p style={{ fontSize: 12, color: '#9A9D9F', marginBottom: 4 }}>{description}</p>}
      <p style={{ fontSize: 11, color: '#9A9D9F', marginBottom: 12 }}>
        {targetStamps} sellos = {rewardDescription || 'un premio'}
      </p>
      {code ? (
        <a href={`/l/${code}`}
          style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 10, background: pc, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Ver mi tarjeta →
        </a>
      ) : (
        <button onClick={getCard} disabled={loading}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: pc, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Un momento...' : 'Obtener mi tarjeta'}
        </button>
      )}
      {error && <p style={{ fontSize: 11, color: '#E8150A', marginTop: 8 }}>{error}</p>}
      {isDemo && <p style={{ fontSize: 10, color: '#9A9D9F', marginTop: 8 }}>(demo — funciona en tu página real)</p>}
    </div>
  )
}

// ─── Business Hours Card ──────────────────────────────────────────
const DAY_LABELS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // display Mon..Sun

function BusinessHoursCard({ title, timezone, schedule, pc }: {
  title: string; timezone: string; schedule: DaySchedule[]; pc: string
}) {
  // Computed after mount only -- "now" depends on the viewer's clock, so
  // rendering it during SSR would create a server/client mismatch.
  const [status, setStatus] = useState<{ isOpen: boolean; today: DaySchedule | null } | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value (clock/URL/localStorage); reading it during render would break hydration
    setStatus(getBusinessOpenStatus(timezone, schedule))
  }, [timezone, schedule])

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(26,27,28,0.09)', borderRadius: 14, marginBottom: 8, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1B1C' }}>{title}</div>
        {status && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: status.isOpen ? '#ECFDF5' : '#FEF0EF',
            color: status.isOpen ? '#16A34A' : '#E8150A',
          }}>
            {status.isOpen ? '● Abierto ahora' : '○ Cerrado ahora'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {DAY_ORDER.map(day => {
          const d = schedule.find(s => s.day === day)
          if (!d) return null
          const isToday = status?.today?.day === day
          return (
            <div key={day} style={{
              display: 'flex', justifyContent: 'space-between', fontSize: 12,
              color: isToday ? pc : '#5A5D60', fontWeight: isToday ? 700 : 400,
            }}>
              <span>{DAY_LABELS_SHORT[day]}</span>
              <span>{d.closed ? 'Cerrado' : `${d.open} – ${d.close}`}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
