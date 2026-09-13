import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { nanoid } from 'nanoid'
import type { DaySchedule } from '@/types'

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

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

// Reads "now" directly in the business's own timezone via Intl (no extra
// date library needed) and checks it against today's row in the schedule.
export function getBusinessOpenStatus(timezone: string, schedule: DaySchedule[]): { isOpen: boolean; today: DaySchedule | null } {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date())
  } catch {
    return { isOpen: false, today: null }
  }
  const weekday = parts.find(p => p.type === 'weekday')?.value ?? 'Sun'
  const hour = (parts.find(p => p.type === 'hour')?.value ?? '00').padStart(2, '0').slice(-2)
  const minute = parts.find(p => p.type === 'minute')?.value ?? '00'
  const nowTime = `${hour === '24' ? '00' : hour}:${minute}`

  const today = schedule.find(s => s.day === WEEKDAY_INDEX[weekday]) ?? null
  if (!today || today.closed) return { isOpen: false, today }
  return { isOpen: nowTime >= today.open && nowTime < today.close, today }
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}
