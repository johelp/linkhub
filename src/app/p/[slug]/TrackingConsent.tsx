'use client'
import { useState, useSyncExternalStore } from 'react'
import Script from 'next/script'

// Owner-configured analytics/ad pixels only run after the visitor accepts.
// The choice is remembered per browser; with no pixels configured nothing is
// shown and nothing is stored. IDs arrive pre-validated by the server page.
const KEY = 'lh_tracking_consent'
type Choice = 'granted' | 'denied' | null

function read(): Choice {
  try { const v = localStorage.getItem(KEY); return v === 'granted' || v === 'denied' ? v : null } catch { return null }
}
const listeners = new Set<() => void>()
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }
function write(v: Exclude<Choice, null>) {
  try { localStorage.setItem(KEY, v) } catch { /* private mode: choice lasts until reload */ }
  listeners.forEach(l => l())
}

export function TrackingConsent({ ga4Id, metaPixelId, pageName }: { ga4Id: string | null; metaPixelId: string | null; pageName: string }) {
  const stored = useSyncExternalStore(subscribe, read, () => 'denied' as Choice)
  const [session, setSession] = useState<Choice>(null)
  const choice = stored ?? session
  const decide = (v: Exclude<Choice, null>) => { setSession(v); write(v) }

  return (
    <>
      {choice === 'granted' && ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}');`}
          </Script>
        </>
      )}
      {choice === 'granted' && metaPixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');`}
        </Script>
      )}
      {choice === null && (
        <div role="region" aria-label="Preferencias de cookies"
          style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 50, maxWidth: 520, margin: '0 auto', background: '#fff', color: '#1A1B1C',
            border: '1px solid rgba(26,27,28,0.12)', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,.14)', padding: '14px 16px', fontSize: 13, lineHeight: 1.5 }}>
          <p style={{ margin: 0 }}>
            {pageName} usa cookies de medición y publicidad (Google Analytics / Meta) para entender cuántas personas visitan esta página.
            {' '}<a href="/legal/cookies" style={{ color: '#1A1B1C', textDecoration: 'underline' }}>Más información</a>
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button type="button" onClick={() => decide('denied')} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1.5px solid rgba(26,27,28,0.2)', background: '#fff', color: '#1A1B1C', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Rechazar</button>
            <button type="button" onClick={() => decide('granted')} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: 'none', background: '#1A1B1C', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Aceptar</button>
          </div>
        </div>
      )}
    </>
  )
}
