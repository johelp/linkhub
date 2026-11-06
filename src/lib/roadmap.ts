// Features we are considering. Kept in code so the list is versioned and the
// landing, the customer panel and the admin panel always agree. Nothing here is
// a promise: the copy says "en estudio" and votes only inform priorities.
export interface RoadmapItem { key: string; title: string; text: string; icon: string }

export const ROADMAP: RoadmapItem[] = [
  { key: 'custom_domain', icon: '🌐', title: 'Dominio propio', text: 'Que tu página viva en tu-nombre.com en lugar de un enlace de LinkHub.' },
  { key: 'appointments_v2', icon: '📅', title: 'Citas con calendario', text: 'Agenda con confirmación automática, recordatorios y sin dobles reservas.' },
  { key: 'invoices', icon: '🧾', title: 'Facturas y datos fiscales', text: 'Emitir facturas de tus cobros con tus datos fiscales.' },
  { key: 'google_business', icon: '📍', title: 'Ficha de Google Business', text: 'Reseñas, horario y fotos de tu ficha de Google dentro de tu página.' },
  { key: 'whatsapp_reminders', icon: '💬', title: 'Recordatorios por WhatsApp', text: 'Avisos automáticos a tus clientes antes de cada cita o pedido.' },
  { key: 'team_access', icon: '👥', title: 'Varias personas en una cuenta', text: 'Que tu equipo gestione la página con su propio acceso.' },
]

export const ROADMAP_KEYS = ROADMAP.map(i => i.key)
export const isRoadmapKey = (v: unknown): v is string => typeof v === 'string' && ROADMAP_KEYS.includes(v)
