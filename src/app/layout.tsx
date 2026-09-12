import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { template: '%s | LinkHub', default: 'LinkHub — Crea tu página de enlaces profesional' },
  description: 'Crea páginas de enlaces profesionales con bloques visuales, multiidioma, QR y analíticas.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: { siteName: 'LinkHub', type: 'website', locale: 'es_ES' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#E8150A',
  width: 'device-width',
  initialScale: 1,
}

// Rewardful (programa de afiliados) -- ver SETUP.md § Programa de afiliados.
// Sin esta env var, el script nunca se carga: `window.Rewardful` no existe,
// UpgradeButton nunca manda un referralId, y /api/checkout se comporta
// exactamente igual que hoy. Site-wide (no solo en el home) porque un
// afiliado puede compartir el link de cualquier página pública, no solo la
// landing -- Rewardful necesita ver la visita para asociar la cookie de
// referido antes de que esa persona se registre.
const rewardfulApiKey = process.env.NEXT_PUBLIC_REWARDFUL_API_KEY

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body style={{ fontFamily: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif" }}>
        {rewardfulApiKey && (
          <>
            <Script id="rewardful-queue" strategy="afterInteractive">
              {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
            </Script>
            <Script async src="https://r.wdfl.co/rw.js" data-rewardful={rewardfulApiKey} strategy="afterInteractive" />
          </>
        )}
        {children}
        <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  )
}
