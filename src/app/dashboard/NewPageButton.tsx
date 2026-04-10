'use client'
import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function NewPageButton({ canCreate, plan }: { canCreate: boolean; plan: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
      blocks: [],
      published: false,
    }).select('id').single()

    setLoading(false)
    if (error) { toast.error('Error al crear la página'); return }
    toast.success('Página creada ✓')
    router.push(`/editor/${data.id}`)
  }

  if (!canCreate) {
    return (
      <a href="/dashboard/upgrade" className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-full"
        style={{background:'#E8150A'}}>
        <Plus size={16}/> Nueva página
      </a>
    )
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-full"
        style={{background:'#E8150A'}}>
        <Plus size={16}/> Nueva página
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{background:'rgba(0,0,0,0.4)'}}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-bold text-lg mb-1" style={{color:'#1A1B1C'}}>Nueva página</h2>
            <p className="text-sm mb-4" style={{color:'#9A9D9F'}}>Dale un nombre a tu página de enlaces</p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()}
              placeholder="Ej: Snowmotion Sierra Nevada"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
              style={{background:'#F6F6F5',border:'1.5px solid rgba(26,27,28,0.09)',color:'#1A1B1C',fontFamily:'inherit'}}
            />
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{background:'#F2F3F4',color:'#5A5D60'}}>
                Cancelar
              </button>
              <button onClick={create} disabled={!name.trim() || loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:'#E8150A'}}>
                {loading ? <Loader2 size={14} className="animate-spin"/> : null}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
