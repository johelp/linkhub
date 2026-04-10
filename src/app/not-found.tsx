import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F6F5' }}>
      <div className="text-center px-4">
        <div className="text-7xl font-bold mb-4" style={{ color: '#E8150A' }}>404</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A1B1C' }}>Página no encontrada</h1>
        <p className="text-sm mb-8" style={{ color: '#9A9D9F' }}>
          Esta página no existe o fue eliminada.
        </p>
        <Link href="/" className="text-sm font-semibold text-white px-6 py-3 rounded-full"
          style={{ background: '#E8150A' }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
