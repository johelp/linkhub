'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Plan } from '@/types'

const R = '#E8150A'
const LIGHT = '#9A9D9F'
const BORDER = 'rgba(26,27,28,0.09)'

export function PlanSelect({ userId, plan }: { userId: string; plan: Plan }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function changePlan(next: Plan) {
    if (next === plan || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/set-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      toast.success(`Plan actualizado a ${next}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cambiar el plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={plan}
      disabled={loading}
      onChange={e => changePlan(e.target.value as Plan)}
      style={{
        fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px',
        color: plan === 'pro' ? R : LIGHT, background: plan === 'pro' ? '#FEF0EF' : '#F2F3F4',
        border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 8px', cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1, fontFamily: 'inherit',
      }}>
      <option value="free">free</option>
      <option value="pro">pro</option>
    </select>
  )
}
