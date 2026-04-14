'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  const router = useRouter()
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }
  return (
    <button onClick={signOut}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '8px 10px', borderRadius: 10, color: '#9A9D9F', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
      <LogOut size={13} /> Cerrar sesión
    </button>
  )
}
