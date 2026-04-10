'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Page, Lang, Block, SeasonMode, LinkBlock, FeaturedBlock, ExpandableBlock, SectionLabelBlock, SocialGridBlock, ContactCardBlock, DividerBlock, TextBlock } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface Props { page: Page }

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

export function PageView({ page }: Props) {
  const [lang, setLang] = useState<Lang>(page.settings.defaultLang)
  const [season, setSeason] = useState<SeasonMode>(page.settings.seasonMode)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const pc = page.settings.primaryColor || '#E8150A'
  const bg = page.settings.backgroundColor || '#F6F6F5'

  // Track page view
  useEffect(() => {
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
    const supabase = createClient()
    supabase.from('analytics_events').insert({
      page_id: page.id,
      event_type: 'click',
      block_id: blockId,
      block_type: blockType,
      url,
      lang,
    }).then(() => {})
  }, [page.id, lang])

  // Filter blocks by season
  const visibleBlocks = page.blocks
    .filter(b => b.visible)
    .filter(b => b.seasonFilter === 'always' || b.seasonFilter === season || season === 'always')
    .sort((a, b) => a.order - b.order)

  const enabledLangs = page.settings.enabledLangs || ['es']
  const showLangBar = enabledLangs.length > 1

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: `'DM Sans', sans-serif` }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 60px' }}>

        {/* Lang bar */}
        {showLangBar && (
          <div style={{ display: 'flex', gap: 6, padding: '14px 0 0', justifyContent: 'flex-end' }}>
            {enabledLangs.map((l: Lang) => (
              <button key={l} onClick={() => setLang(l)}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20,
                  border: `1px solid ${l === lang ? pc : 'rgba(26,27,28,0.15)'}`,
                  background: l === lang ? pc : 'transparent',
                  color: l === lang ? '#fff' : '#9A9D9F',
                  cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.3px',
                }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Season admin (only if page has season blocks) */}
        {page.settings.seasonMode !== 'always' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0 0' }}>
            {(['winter','summer','off'] as SeasonMode[]).map(s => (
              <button key={s} onClick={() => setSeason(s)}
                style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                  border: `1px solid ${s === season ? pc : 'rgba(26,27,28,0.15)'}`,
                  background: s === season ? pc : 'transparent',
                  color: s === season ? '#fff' : '#9A9D9F',
                  marginLeft: 4, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                {s === 'winter' ? '❄️' : s === 'summer' ? '☀️' : '⏸'}
              </button>
            ))}
          </div>
        )}

        {/* Blocks */}
        <div style={{ marginTop: 16 }}>
          {visibleBlocks.map(block => (
            <BlockRenderer
              key={block.id}
              block={block}
              lang={lang}
              pc={pc}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onTrackClick={trackClick}
            />
          ))}
        </div>

        {/* Powered by */}
        {page.settings.showPoweredBy && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <a href="https://linkhub.app" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#9A9D9F', textDecoration: 'none' }}>
              Creado con LinkHub
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Block Renderer ──────────────────────────────────────────────
function BlockRenderer({ block, lang, pc, expandedId, setExpandedId, onTrackClick }: {
  block: Block; lang: Lang; pc: string
  expandedId: string | null; setExpandedId: (id: string | null) => void
  onTrackClick: (id: string, type: string, url: string) => void
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
        b.data.whatsapp && { icon: '💬', label: 'WhatsApp', href: `https://wa.me/${b.data.whatsapp.replace(/\D/g, '')}` },
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

    default:
      return null
  }
}
