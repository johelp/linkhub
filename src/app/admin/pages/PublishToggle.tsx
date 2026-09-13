'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const R = '#E8150A'
const MUTED = '#5A5D60'
const BORDER = 'rgba(26,27,28,0.09)'

export function PublishToggle({ pageId, published }: { pageId: string; published: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/toggle-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, published: !published }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      toast.success(published ? 'Página despublicada' : 'Página publicada')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={toggle} disabled={loading}
      style={{
        fontSize: 11.5, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: loading ? 'wait' : 'pointer',
        border: `1px solid ${published ? 'rgba(232,21,10,0.3)' : BORDER}`, background: published ? '#fff' : '#F2F3F4',
        color: published ? R : MUTED, opacity: loading ? 0.6 : 1, fontFamily: 'inherit',
      }}>
      {published ? 'Despublicar' : 'Publicar'}
    </button>
  )
}
