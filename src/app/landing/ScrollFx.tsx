'use client'
import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const R = '#E8150A'
const INK = '#111314'
const MUTED = '#4A4E52'

// One shared observer for every <Reveal>: cheap even with dozens of targets.
let observer: IntersectionObserver | null = null
function getObserver() {
  if (!observer && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          observer?.unobserve(e.target)
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
  }
  return observer
}

// Fades + lifts its children in when they scroll into view. Without JS or with
// reduced motion the content is simply visible (see .reveal in globals.css).
export function Reveal({ children, delay = 0, style, className = '' }: {
  children: ReactNode; delay?: number; style?: CSSProperties; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    const io = getObserver()
    if (!el) return
    if (!io) { el.classList.add('in'); return }
    io.observe(el)
    return () => io.unobserve(el)
  }, [])
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ ...style, transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// Moves its children at a fraction of the scroll speed (a subtle depth cue).
// Runs in a single rAF-throttled listener and is disabled for reduced motion.
export function Parallax({ children, speed = 0.12, style }: { children: ReactNode; speed?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      frame = 0
      if (ref.current) ref.current.style.transform = `translate3d(0, ${Math.min(window.scrollY, 900) * -speed}px, 0)`
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame) }
  }, [speed])
  return <div ref={ref} style={{ willChange: 'transform', ...style }}>{children}</div>
}

const LINKS = [
  { href: '#funciones', label: 'Producto' },
  { href: '#rubros', label: 'Para quién' },
  { href: '#precios', label: 'Precios' },
  { href: '#faq', label: 'Preguntas' },
]

// Sticky navigation: transparent at the top, frosted once you scroll, with a
// thin reading-progress bar and the primary CTA always one tap away.
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      setScrolled(y > 8)
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame) }
  }, [])

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40, transition: 'background .2s, box-shadow .2s',
      background: scrolled ? 'rgba(250,250,248,0.88)' : '#FAFAF8',
      backdropFilter: scrolled ? 'saturate(180%) blur(14px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(14px)' : 'none',
      boxShadow: scrolled ? '0 1px 0 rgba(26,27,28,0.08)' : 'none',
    }}>
      <nav aria-label="Principal" style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 28 }}>
        <Link href="/" style={{ fontSize: 21, fontWeight: 700, color: INK, textDecoration: 'none', marginRight: 'auto' }}>
          Link<span style={{ color: R }}>Hub</span>
        </Link>
        <div className="hidden md:flex" style={{ gap: 24 }}>
          {LINKS.map(l => (
            <a key={l.href} href={l.href} className="lh-navlink" style={{ fontSize: 14, fontWeight: 500, color: MUTED, textDecoration: 'none' }}>{l.label}</a>
          ))}
        </div>
        <Link href="/auth" className="hidden sm:inline" style={{ fontSize: 14, fontWeight: 500, color: MUTED, textDecoration: 'none' }}>Iniciar sesión</Link>
        <Link href="/auth" style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: INK, padding: '10px 20px', borderRadius: 999, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Empezar gratis
        </Link>
      </nav>
      <div ref={bar} aria-hidden style={{ height: 2, background: INK, transformOrigin: '0 50%', transform: 'scaleX(0)', opacity: scrolled ? 1 : 0, transition: 'opacity .2s' }} />
    </header>
  )
}

// Mobile-only bottom CTA that appears once the hero is out of view, and steps
// aside when the pricing / closing CTA sections are on screen.
export function StickyCta() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const closing = document.getElementById('empezar')
      const nearEnd = closing ? closing.getBoundingClientRect().top < window.innerHeight : false
      setShow(window.scrollY > 640 && !nearEnd)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame) }
  }, [])
  return (
    <div className="md:hidden" aria-hidden={!show} style={{
      position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 40, transition: 'transform .25s ease, opacity .25s',
      transform: show ? 'none' : 'translateY(140%)', opacity: show ? 1 : 0, pointerEvents: show ? 'auto' : 'none',
    }}>
      <Link href="/auth" tabIndex={show ? 0 : -1} style={{
        display: 'block', textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#fff', background: R, padding: '14px 20px',
        borderRadius: 16, textDecoration: 'none', boxShadow: '0 10px 30px rgba(232,21,10,0.4)',
      }}>
        Crear mi página gratis →
      </Link>
    </div>
  )
}
