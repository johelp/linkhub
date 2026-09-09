import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { nanoid } from 'nanoid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
  return `${base}-${nanoid(6)}`
}

export function generateId(): string {
  return nanoid(10)
}

export function absoluteUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(date))
}

export interface VideoEmbed {
  kind: 'youtube' | 'vimeo' | 'file' | 'unknown'
  embedUrl?: string
}

// Recognizes YouTube/Vimeo links and turns them into embeddable player URLs;
// a direct video file link (mp4/webm/mov/ogg) is returned as-is for <video>.
export function parseVideoEmbed(url: string): VideoEmbed {
  if (!url) return { kind: 'unknown' }
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  if (youtube) return { kind: 'youtube', embedUrl: `https://www.youtube.com/embed/${youtube[1]}` }
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` }
  if (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url)) return { kind: 'file', embedUrl: url }
  return { kind: 'unknown' }
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}
