'use client'
import { useState } from 'react'
import { Plus, Loader2, X, ArrowLeft, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug, generateId } from '@/lib/utils'
import { draftToPage, type Draft } from '@/lib/aiDraft'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PAGE_TEMPLATES, templateRequiresPro, type PageTemplate } from '@/lib/blocks/templates'
import type { Plan } from '@/types'
import type { Json } from '@/lib/supabase/database.types'

interface Props {
  canCreate: boolean
  plan: Plan
  asCard?: boolean  // renders as a grid card instead of button
  aiEnabled?: boolean // flag ai_onboarding: offers "Crear con IA"
}

export function NewPageButton({ canCreate, plan, asCard, aiEnabled }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'pick' | 'name' | 'ai'>('pick')
  const [template, setTemplate] = useState<PageTemplate | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiDraft, setAiDraft] = useState<Draft | null>(null)
  const [aiSource, setAiSource] = useState<'ai' | 'basic'>('ai')
  const router = useRouter()

  function close() {
    setOpen(false)
    setStep('pick')
    setTemplate(null)
    setName('')
    setAiText('')
    setAiDraft(null)
  }

  function pick(t: PageTemplate | null) {
    if (t && templateRequiresPro(t) && plan === 'free') {
      close()
      router.push('/dashboard/upgrade')
      return
    }
    setTemplate(t)
    setStep('name')
  }

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: aiText, businessName: name }) })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || 'No se pudo generar la propuesta'); return }
      setAiDraft(json.draft); setAiSource(json.source)
    } catch { toast.error('No se pudo generar la propuesta') } finally { setLoading(false) }
  }

  async function create() {
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sesión expirada'); setLoading(false); return }

    const generated = aiDraft ? draftToPage(aiDraft, generateId) : null
    const slug = generateSlug(name)
    const { data, error } = await supabase.from('pages').insert({
      user_id: user.id,
      slug,
      name: name.trim(),
      settings: {
        defaultLang: 'es',
        enabledLangs: ['es'],
        seasonMode: 'always',
        primaryColor: generated?.settings.primaryColor ?? '#E8150A',
        backgroundColor: '#F6F6F5',
        fontFamily: 'DM Sans',
        showPoweredBy: true,
        seo: { title: name.trim(), description: generated?.settings.description ?? '', ogImage: null, ...(generated ? { schemaType: generated.settings.schemaType } : {}) },
        ...(generated ? { profile: { tagline: generated.settings.tagline } } : {}),
      },
      blocks: (generated ? generated.blocks : template ? template.buildBlocks(name.trim()) : []) as unknown as Json,
      published: false,
    }).select('id').single()

    if (!error && generated?.knowledge.length) {
      // Public FAQ entries for this page; the page is already created, so a failure here is not fatal.
      await supabase.from('knowledge_entries' as never).insert(generated.knowledge.map((q, i) => ({
        user_id: user.id, page_id: data!.id, kind: 'faq', title: q.question, content: q.answer, visibility: 'public', position: i,
      })) as never)
    }
    setLoading(false)
    if (error) { toast.error('Error al crear la página: ' + error.message); return }
    toast.success('Página creada ✓')
    close()
    router.push(`/editor/${data.id}`)
  }

  if (!canCreate) {
    return (
      <a href="/dashboard/upgrade"
        style={asCard ? cardStyle : btnStyle}>
        {asCard ? <><div style={cardIconStyle}><Plus size={20} color="#E8150A" /></div><span style={{ fontSize: 13, fontWeight: 500, color: '#5A5D60' }}>Nueva página</span></> : <><Plus size={15} /> Nueva página</>}
      </a>
    )
  }

  return (
    <>
      {asCard ? (
        <button onClick={() => setOpen(true)} style={cardStyle}>
          <div style={cardIconStyle}><Plus size={20} color="#E8150A" /></div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#5A5D60' }}>Nueva página</span>
        </button>
      ) : (
        <button onClick={() => setOpen(true)} style={btnStyle}>
          <Plus size={15} /> Nueva página
        </button>
      )}

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.45)' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: step === 'pick' ? 460 : 380, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {step === 'pick' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1B1C' }}>Nueva página</h2>
                  <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6E71', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: '#6B6E71', marginBottom: 16 }}>Empezá en blanco o arrancá con una plantilla</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {aiEnabled && <TemplateCard icon="🪄" label="Crear con IA" description="Cuéntanos tu negocio y te proponemos una primera versión" onClick={() => setStep('ai')} />}
                  <TemplateCard icon="✨" label="Vacía" description="Página en blanco" onClick={() => pick(null)} />
                  {PAGE_TEMPLATES.map(t => (
                    <TemplateCard key={t.id} icon={t.icon} label={t.label} description={t.description}
                      locked={templateRequiresPro(t) && plan === 'free'}
                      onClick={() => pick(t)} />
                  ))}
                </div>
              </>
            ) : step === 'ai' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <button onClick={() => (aiDraft ? setAiDraft(null) : setStep('pick'))} aria-label="Volver" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6E71', padding: 4, display: 'flex' }}><ArrowLeft size={18} /></button>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1B1C' }}>Crear con IA</h2>
                  <button onClick={close} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6E71', padding: 4 }}><X size={18} /></button>
                </div>
                {!aiDraft ? (
                  <>
                    <p style={{ fontSize: 13, color: '#6B6E71', marginBottom: 12 }}>Cuéntanos a qué te dedicas, qué ofreces y a quién. Después podrás editarlo todo.</p>
                    <input aria-label="Nombre del negocio" value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="Nombre de tu negocio"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(26,27,28,0.12)', background: '#F6F6F5', fontSize: 14, marginBottom: 8, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <textarea aria-label="Descripción del negocio" value={aiText} onChange={e => setAiText(e.target.value)} maxLength={800} rows={5}
                      placeholder="Ej: Soy fisioterapeuta en Valencia. Hago rehabilitación deportiva, punción seca y tratamiento de espalda. Atiendo con cita previa."
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(26,27,28,0.12)', background: '#F6F6F5', fontSize: 14, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <button onClick={generate} disabled={!name.trim() || aiText.trim().length < 20 || loading}
                      style={{ marginTop: 12, width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', background: '#E8150A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: !name.trim() || aiText.trim().length < 20 || loading ? 0.6 : 1, fontFamily: 'inherit' }}>
                      {loading ? 'Preparando propuesta…' : 'Generar propuesta'}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ background: '#F6F6F5', borderRadius: 12, padding: 14, fontSize: 13, color: '#1A1B1C', lineHeight: 1.5 }}>
                      <p style={{ fontWeight: 700, margin: 0 }}>{name}</p>
                      <p style={{ margin: '2px 0 8px', color: '#5A5D60' }}>{aiDraft.tagline}</p>
                      {aiDraft.bio && <p style={{ margin: '0 0 8px' }}>{aiDraft.bio}</p>}
                      {aiDraft.services.length > 0 && <ul style={{ margin: '0 0 8px', paddingLeft: 18 }}>{aiDraft.services.map(s => <li key={s.title}>{s.title}</li>)}</ul>}
                      {aiDraft.faq.length > 0 && <p style={{ margin: 0, color: '#5A5D60' }}>+ {aiDraft.faq.length} preguntas frecuentes</p>}
                    </div>
                    {aiSource === 'basic' && <p style={{ fontSize: 12, color: '#6B6E71', margin: '8px 0 0' }}>No hemos podido usar el asistente ahora mismo; te dejamos una base sencilla para editar.</p>}
                    <p style={{ fontSize: 12, color: '#6B6E71', margin: '8px 0 0' }}>Revisa los textos: el asistente puede equivocarse y no conoce tus precios ni tu dirección.</p>
                    <button onClick={create} disabled={loading}
                      style={{ marginTop: 12, width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', background: '#E8150A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
                      {loading ? 'Creando…' : 'Usar esta propuesta'}
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <button onClick={() => setStep('pick')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6E71', padding: 4, display: 'flex' }}>
                    <ArrowLeft size={18} />
                  </button>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1B1C' }}>Nueva página</h2>
                  <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6E71', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: '#6B6E71', marginBottom: 16 }}>Dale un nombre a tu página de enlaces</p>
                <input
                  autoFocus type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && create()}
                  placeholder="Ej: Snowmotion Sierra Nevada"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(26,27,28,0.12)', background: '#F6F6F5', fontSize: 14, color: '#1A1B1C', outline: 'none', fontFamily: 'inherit', marginBottom: 12 }}
                  onFocus={e => (e.target.style.borderColor = '#E8150A')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(26,27,28,0.12)')}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={close}
                    style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#F2F3F4', color: '#5A5D60', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancelar
                  </button>
                  <button onClick={create} disabled={!name.trim() || loading}
                    style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#E8150A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: !name.trim() || loading ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {loading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                    Crear página
                  </button>
                </div>
              </>
            )}
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </>
  )
}

function TemplateCard({ icon, label, description, locked, onClick }: { icon: string; label: string; description: string; locked?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left',
        padding: '12px 12px', borderRadius: 14, border: '1.5px solid rgba(26,27,28,0.09)',
        background: '#F6F6F5', cursor: 'pointer', fontFamily: 'inherit', position: 'relative',
      }}>
      {locked && (
        <span style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#B50F07', background: '#FEF0EF', padding: '2px 6px', borderRadius: 20 }}>
          <Lock size={9} /> PRO
        </span>
      )}
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1B1C' }}>{label}</span>
      <span style={{ fontSize: 11, color: '#6B6E71', lineHeight: 1.3 }}>{description}</span>
    </button>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 600, color: '#fff',
  background: '#E8150A', border: 'none', borderRadius: 20,
  padding: '9px 16px', cursor: 'pointer', fontFamily: 'inherit',
}

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1.5px dashed rgba(26,27,28,0.15)',
  borderRadius: 14, padding: 16, minHeight: 150,
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', gap: 10, cursor: 'pointer',
  textDecoration: 'none', width: '100%',
  transition: 'border-color .15s',
}

const cardIconStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12,
  background: '#FEF0EF', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
}
