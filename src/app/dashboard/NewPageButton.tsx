'use client'
import { useState } from 'react'
import { Plus, Loader2, X, ArrowLeft, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PAGE_TEMPLATES, templateRequiresPro, type PageTemplate } from '@/lib/blocks/templates'
import type { Plan } from '@/types'
import type { Json } from '@/lib/supabase/database.types'

interface Props {
  canCreate: boolean
  plan: Plan
  asCard?: boolean  // renders as a grid card instead of button
}

export function NewPageButton({ canCreate, plan, asCard }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'pick' | 'name'>('pick')
  const [template, setTemplate] = useState<PageTemplate | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function close() {
    setOpen(false)
    setStep('pick')
    setTemplate(null)
    setName('')
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

  async function create() {
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sesión expirada'); setLoading(false); return }

    const slug = generateSlug(name)
    const { data, error } = await supabase.from('pages').insert({
      user_id: user.id,
      slug,
      name: name.trim(),
      settings: {
        defaultLang: 'es',
        enabledLangs: ['es'],
        seasonMode: 'always',
        primaryColor: '#E8150A',
        backgroundColor: '#F6F6F5',
        fontFamily: 'DM Sans',
        showPoweredBy: true,
        seo: { title: name.trim(), description: '', ogImage: null },
      },
      blocks: (template ? template.buildBlocks(name.trim()) : []) as unknown as Json,
      published: false,
    }).select('id').single()

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
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: step === 'pick' ? 460 : 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {step === 'pick' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1B1C' }}>Nueva página</h2>
                  <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9D9F', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: '#9A9D9F', marginBottom: 16 }}>Empezá en blanco o arrancá con una plantilla</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <TemplateCard icon="✨" label="Vacía" description="Página en blanco" onClick={() => pick(null)} />
                  {PAGE_TEMPLATES.map(t => (
                    <TemplateCard key={t.id} icon={t.icon} label={t.label} description={t.description}
                      locked={templateRequiresPro(t) && plan === 'free'}
                      onClick={() => pick(t)} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <button onClick={() => setStep('pick')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9D9F', padding: 4, display: 'flex' }}>
                    <ArrowLeft size={18} />
                  </button>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1B1C' }}>Nueva página</h2>
                  <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9D9F', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: '#9A9D9F', marginBottom: 16 }}>Dale un nombre a tu página de enlaces</p>
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
      <span style={{ fontSize: 11, color: '#9A9D9F', lineHeight: 1.3 }}>{description}</span>
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
