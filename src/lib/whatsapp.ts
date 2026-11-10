// One WhatsApp number for the whole page ("Cabecera" in the editor). Blocks that
// send messages (orders, appointment requests) use their own number when set
// and fall back to the page's, so the owner types it once.
interface WithWhatsapp { settings?: { profile?: { whatsapp?: string } }; blocks: unknown[] }

export const cleanWhatsapp = (v: unknown): string => (typeof v === 'string' ? v.replace(/[^\d+()\s-]/g, '').slice(0, 24).trim() : '')

export function withPageWhatsapp<T extends WithWhatsapp>(page: T): T {
  const fallback = cleanWhatsapp(page.settings?.profile?.whatsapp)
  if (!fallback) return page
  return {
    ...page,
    blocks: (page.blocks as { type?: string; data?: { whatsapp?: string } }[]).map(b =>
      (b.type === 'order_menu' || b.type === 'appointment_request') && !(b.data?.whatsapp ?? '').replace(/\D/g, '')
        ? { ...b, data: { ...b.data, whatsapp: fallback } }
        : b),
  }
}
