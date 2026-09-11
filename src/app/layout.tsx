import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body style={{ fontFamily: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif" }}>
        {children}
        <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  )
}
