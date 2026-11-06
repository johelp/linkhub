// Turns what an owner pastes (an address, a Maps link, or the whole <iframe>
// snippet from "Share > Embed a map") into a SAFE embed URL. We never place the
// pasted text in the page: only a URL we rebuild on a Google Maps host.
const ALLOWED_HOSTS = new Set(['www.google.com', 'google.com', 'maps.google.com'])

export function mapEmbedUrl(input: string): string | null {
  const raw = (input ?? '').trim()
  if (!raw) return null
  const fromIframe = /<iframe[^>]+src=["']([^"']+)["']/i.exec(raw)?.[1]
  const candidate = (fromIframe ?? raw).replace(/&amp;/g, '&')
  if (/^https?:\/\//i.test(candidate)) {
    try {
      const u = new URL(candidate)
      if (u.protocol !== 'https:' || !ALLOWED_HOSTS.has(u.hostname)) return null
      if (u.pathname.startsWith('/maps/embed')) return u.toString()           // official embed link
      const q = u.searchParams.get('q') || u.searchParams.get('query')
      if (q) return `https://www.google.com/maps?q=${encodeURIComponent(q.slice(0, 200))}&output=embed`
      const place = /\/maps\/place\/([^/@?]+)/.exec(u.pathname)?.[1]
      return place ? `https://www.google.com/maps?q=${encodeURIComponent(decodeURIComponent(place.replace(/\+/g, ' ')).slice(0, 200))}&output=embed` : null
    } catch { return null }
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(raw.slice(0, 200))}&output=embed`   // plain address
}
