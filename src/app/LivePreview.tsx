'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buildDemoPage } from './demoPage'
import { PageView } from './p/[slug]/PageView'

const INK = '#111314'
const BODY = '#3F4346'
const LINE = 'rgba(17,19,20,0.10)'

// Interactive proof: type a business name and see a real page render.
export function LivePreview() {
  const [name, setName] = useState('')
  const page = buildDemoPage(name, !!name.trim())

  return (
    <section id="probar" aria-labelledby="probar-h" className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-2 items-center">
        <div className="max-w-[500px]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#5B6064' }}>Pruébalo</p>
          <h2 id="probar-h" className="mt-3 font-bold" style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', lineHeight: 1.12, letterSpacing: '-0.03em', color: INK }}>Mira cómo quedaría tu página</h2>
          <p className="mt-4 text-[18px] leading-relaxed" style={{ color: BODY }}>Escribe el nombre de tu negocio y la vista previa se actualiza al momento. No hace falta registrarse.</p>
          <label className="block mt-8">
            <span className="block text-[14px] font-semibold mb-2" style={{ color: INK }}>Nombre de tu negocio o tu nombre</span>
            <input type="text" value={name} maxLength={40} onChange={e => setName(e.target.value)} placeholder="Ej.: Clínica Aurora"
              className="w-full rounded-xl px-4 text-[16px] outline-none bg-white focus:border-[#111314]" style={{ height: 52, border: `1.5px solid ${LINE}`, color: INK }} />
          </label>
          <Link href="/auth" className="mt-5 inline-flex items-center gap-2 rounded-full px-7 text-[16px] font-semibold text-white no-underline hover:brightness-95" style={{ height: 52, background: '#E8150A' }}>
            {name.trim() ? `Crear la página de ${name.trim()}` : 'Crear mi página gratis'} <ArrowRight size={17} aria-hidden />
          </Link>
        </div>

        <div className="flex justify-center">
          <div style={{ width: 'min(100%, 320px)', borderRadius: 40, border: `10px solid ${INK}`, background: '#fff', overflow: 'hidden', maxHeight: 520, position: 'relative', boxShadow: '0 1px 2px rgba(17,19,20,.06), 0 40px 80px -30px rgba(17,19,20,.35)' }}
            role="img" aria-label="Vista previa de tu página">
            <div style={{ maxHeight: 500, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden><PageView page={page} /></div>
            <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(255,255,255,0), #fff)' }} />
          </div>
        </div>
      </div>
    </section>
  )
}
