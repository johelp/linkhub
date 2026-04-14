import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const format = searchParams.get('format') || 'svg'

  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  // Build URL from request origin so it works on any domain (local, Vercel preview, production)
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
  const url = `${origin}/p/${slug}`

  try {
    if (format === 'png') {
      const buf = await QRCode.toBuffer(url, {
        type: 'png',
        margin: 2,
        color: { dark: '#1A1B1C', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
        width: 512,
      })
      return new NextResponse(buf as unknown as BodyInit, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="qr-${slug}.png"`,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    const svg = await QRCode.toString(url, {
      type: 'svg',
      margin: 2,
      color: { dark: '#1A1B1C', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
      width: 400,
    })
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'QR generation failed' }, { status: 500 })
  }
}
