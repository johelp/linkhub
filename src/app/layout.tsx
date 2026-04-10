import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

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
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}>
        {children}
        <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  )
}
