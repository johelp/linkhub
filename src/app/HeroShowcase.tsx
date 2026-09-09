'use client'
import { useState, useEffect } from 'react'
import { HERO_EXAMPLES } from './demoPage'
import { PageView } from './p/[slug]/PageView'

const R = '#E8150A'

export function HeroShowcase() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % HERO_EXAMPLES.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="hero-scale-in" style={{ animationDelay: '.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', perspective: 1200 }}>
      <div className="hero-float">
        <div className="hero-phone-tilt">
          <div style={{
            width: 300, borderRadius: 36, border: '10px solid #1A1B1C', background: '#fff',
            overflow: 'hidden', boxShadow: '0 30px 70px rgba(26,27,28,0.22)', maxHeight: 560,
          }}>
            <div key={HERO_EXAMPLES[index].page.id} className="hero-fade-up" style={{ animationDuration: '0.4s', maxHeight: 540, overflow: 'hidden' }}>
              <PageView page={HERO_EXAMPLES[index].page} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        {HERO_EXAMPLES.map((ex, i) => (
          <button key={ex.page.id} onClick={() => setIndex(i)}
            style={{
              fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${i === index ? R : 'rgba(26,27,28,0.15)'}`,
              background: i === index ? R : 'transparent',
              color: i === index ? '#fff' : '#9A9D9F',
              transition: 'all .2s',
            }}>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  )
}
