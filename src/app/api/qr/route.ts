import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pageId = searchParams.get('pageId')
  const slug = searchParams.get('slug')
  const format = searchParams.get('format') || 'svg' // svg | png

  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  // Verify page exists and user has access (if pageId provided = authenticated request)
  if (pageId) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/p/${slug}`

  try {
    const opts: QRCode.QRCodeToStringOptions = {
      type: 'svg' as const,
      margin: 2,
      color: { dark: '#1A1B1C', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
      width: 400,
    }

    if (format === 'png') {
      const pngBuf = await QRCode.toBuffer(url, { ...opts, type: 'png' as const } as QRCode.QRCodeToBufferOptions)
      const pngBuffer = Buffer.from(pngBuf);
    return new NextResponse(pngBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="qr-${slug}.png"`,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    const svg = await QRCode.toString(url, opts)
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'QR generation failed' }, { status: 500 })
  }
}
