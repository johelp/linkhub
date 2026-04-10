import { Suspense } from 'react'
import { AuthForm } from './AuthForm'

export const metadata = { title: 'Acceder | LinkHub' }

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F6F5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
          <p style={{ fontSize: 14, color: '#9A9D9F' }}>Cargando...</p>
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
