import type { Page, Block, Lang } from '@/types'
import type { KnowledgeEntry } from '@/lib/knowledge'

// Example pages, one per niche and market, built from the same blocks a
// customer uses. They are fictional (names, addresses and phones are made up)
// and rendered with `preview` behaviour: no real WhatsApp chat is ever opened.

export type MarketId = 'es' | 'ar' | 'mx'

interface Market {
  id: MarketId; label: string; currency: string; timezone: string; city: string; street: string
  phone: string; mult: number; flag: string; country: string
}

export const MARKETS: Market[] = [
  { id: 'es', label: 'España', currency: 'EUR', timezone: 'Europe/Madrid', city: 'Madrid', street: 'Calle de Alcalá 120', phone: '34 600 00 00 00', mult: 1, flag: '🇪🇸', country: 'España' },
  { id: 'ar', label: 'Argentina', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires', city: 'Buenos Aires', street: 'Av. Santa Fe 1850', phone: '54 9 11 0000 0000', mult: 1000, flag: '🇦🇷', country: 'Argentina' },
  { id: 'mx', label: 'México', currency: 'MXN', timezone: 'America/Mexico_City', city: 'Ciudad de México', street: 'Av. Insurgentes Sur 1200', phone: '52 55 0000 0000', mult: 20, flag: '🇲🇽', country: 'México' },
]
export const marketById = (id: string | undefined): Market => MARKETS.find(m => m.id === id) ?? MARKETS[0]

export interface Niche { slug: string; label: string; who: string; shows: string[]; color: string; schema: string }

export const NICHES: Niche[] = [
  { slug: 'psicologia', label: 'Psicología y terapia', who: 'Consultas de salud mental y bienestar', shows: ['Solicitud de cita', 'Bono de sesiones', 'Preguntas frecuentes', 'Guardar contacto'], color: '#0F766E', schema: 'MedicalBusiness' },
  { slug: 'abogacia', label: 'Abogacía y asesoría', who: 'Despachos y asesores independientes', shows: ['Primera consulta', 'Áreas de práctica', 'Preguntas frecuentes', 'Mapa y contacto'], color: '#1E3A8A', schema: 'LegalService' },
  { slug: 'fisioterapia', label: 'Fisioterapia y salud', who: 'Clínicas y profesionales sanitarios', shows: ['Citas por tratamiento', 'Tarifas claras', 'Horarios', 'Mapa de Google'], color: '#0E7490', schema: 'MedicalBusiness' },
  { slug: 'peluqueria', label: 'Peluquería y estética', who: 'Salones, barberías y centros de belleza', shows: ['Reserva de servicios', 'Precios por servicio', 'Horario en vivo', 'Redes sociales'], color: '#BE185D', schema: 'HairSalon' },
  { slug: 'entrenamiento', label: 'Entrenamiento y deporte', who: 'Entrenadores personales y estudios', shows: ['Sesión de prueba', 'Bonos', 'Horarios de clases', 'Preguntas frecuentes'], color: '#C2410C', schema: 'SportsActivityLocation' },
  { slug: 'clases', label: 'Clases y formación', who: 'Academias, profesores de idiomas y música', shows: ['Clase de prueba', 'Tarifas por nivel', 'Calendario', 'Preguntas frecuentes'], color: '#6D28D9', schema: 'EducationalOrganization' },
  { slug: 'restaurante', label: 'Restaurantes', who: 'Restaurantes con carta y pedidos', shows: ['Carta completa', 'Pedidos a domicilio', 'Horario', 'Mapa'], color: '#B91C1C', schema: 'Restaurant' },
  { slug: 'cafeteria', label: 'Cafeterías', who: 'Cafés, panaderías y obradores', shows: ['Carta', 'Tarjeta de sellos', 'Horario', 'Cómo llegar'], color: '#92400E', schema: 'CafeOrCoffeeShop' },
  { slug: 'tienda', label: 'Tiendas y artesanía', who: 'Comercios y marcas pequeñas', shows: ['Catálogo con carrito', 'Pedidos por WhatsApp', 'Envíos y devoluciones', 'Redes'], color: '#166534', schema: 'Store' },
  { slug: 'eventos', label: 'Eventos', who: 'Festivales, talleres y encuentros', shows: ['Entradas con QR', 'Información del evento', 'Mapa', 'Preguntas frecuentes'], color: '#9D174D', schema: 'LocalBusiness' },
  { slug: 'turismo', label: 'Turismo y excursiones', who: 'Guías, alquileres y experiencias', shows: ['Reserva de experiencias', 'Varios idiomas', 'Horarios por temporada', 'Mapa'], color: '#1D4ED8', schema: 'TravelAgency' },
  { slug: 'creadores', label: 'Creadores y freelance', who: 'Diseñadores, fotógrafos y consultores', shows: ['Portfolio', 'Captura de emails', 'Guardar contacto', 'Redes'], color: '#111827', schema: 'Person' },
]

export interface ExamplePage { niche: Niche; market: Market; page: Page; knowledge: KnowledgeEntry[] }

const LANGS: Lang[] = ['es', 'en', 'pt', 'fr', 'de', 'it']
function T<K extends string>(es: Record<K, string>, en?: Record<K, string>): Record<Lang, Record<K, string>> {
  const blank = Object.fromEntries(Object.keys(es).map(k => [k, ''])) as Record<K, string>
  return Object.fromEntries(LANGS.map(l => [l, l === 'es' ? es : l === 'en' && en ? en : blank])) as Record<Lang, Record<K, string>>
}

// Round a base price (in euros) to a "nice" number in the market's currency.
const price = (m: Market, eur: number) => (m.mult === 1 ? eur : Math.round((eur * m.mult) / (m.mult >= 1000 ? 500 : 10)) * (m.mult >= 1000 ? 500 : 10))
const sched = (open: string, close: string, days: number[], sat?: [string, string]) =>
  [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, closed: !days.includes(d) && !(d === 6 && sat), open: d === 6 && sat ? sat[0] : open, close: d === 6 && sat ? sat[1] : close }))
const WEEK = [1, 2, 3, 4, 5]
const waNumber = (m: Market) => m.phone.replace(/\D/g, '')
const faq = (i: number, title: string, content: string, id: string): KnowledgeEntry => ({ id: `${id}-faq${i}`, page_id: null, kind: 'faq', title, content, visibility: 'public', position: i })

let n = 0
const bid = () => `ex${++n}`

type B = Block
const hours = (title: string, m: Market, schedule: ReturnType<typeof sched>): B => ({ id: bid(), type: 'business_hours', order: 0, visible: true, seasonFilter: 'always', data: { translations: T({ title }), timezone: m.timezone, schedule } } as B)
const contact = (m: Market, msg: string, address = m.street + ', ' + m.city): B => ({ id: bid(), type: 'contact_card', order: 0, visible: true, seasonFilter: 'always', data: { whatsapp: waNumber(m), whatsappMessage: msg, address, email: 'hola@ejemplo.com' } } as B)
const social = (...p: ('instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin')[]): B => ({ id: bid(), type: 'social_grid', order: 0, visible: true, seasonFilter: 'always', data: { items: p.map((pl, i) => ({ id: `s${i}`, platform: pl, url: `https://${pl}.com/`, label: pl[0].toUpperCase() + pl.slice(1) })) } } as B)
const map = (m: Market, q?: string): B => ({ id: bid(), type: 'map_embed', order: 0, visible: true, seasonFilter: 'always', data: { query: q ?? `${m.street}, ${m.city}`, height: 260 } } as B)
const vcard = (name: string, title: string): B => ({ id: bid(), type: 'vcard', order: 0, visible: true, seasonFilter: 'always', data: { translations: T({ label: 'Guardar en mis contactos' }), fullName: name, jobTitle: title, organization: '', phone: '', email: '', address: '', note: '' } } as B)
const faqBlock = (): B => ({ id: bid(), type: 'faq', order: 0, visible: true, seasonFilter: 'always', data: { translations: T({ title: 'Preguntas frecuentes' }) } } as B)
const appt = (m: Market, title: string, desc: string, services: [string, number, number | undefined][], schedule: ReturnType<typeof sched>, slot = 60): B => ({
  id: bid(), type: 'appointment_request', order: 0, visible: true, seasonFilter: 'always',
  data: { translations: T({ title, description: desc }), whatsapp: m.phone, timezone: m.timezone, currency: m.currency, schedule, slotMinutes: slot, daysAhead: 14, minNoticeHours: 12,
    services: services.map(([name, durationMin, eur], i) => ({ id: `sv${i}`, translations: T({ name, description: '' }), durationMin, ...(eur ? { price: price(m, eur) } : {}) })) },
} as B)
const orders = (m: Market, title: string, desc: string, cats: [string, [string, string, number][]][], fee = 0, min = 0): B => ({
  id: bid(), type: 'order_menu', order: 0, visible: true, seasonFilter: 'always',
  data: { translations: T({ title, description: desc }), currency: m.currency, whatsapp: m.phone, delivery: true, pickup: true, deliveryFee: price(m, fee), minOrder: price(m, min), notesPlaceholder: 'Aclaraciones (alergias, timbre…)',
    categories: cats.map(([name, items], ci) => ({ id: `c${ci}`, translations: T({ name }), items: items.map(([nm, ds, eur], ii) => ({ id: `i${ci}${ii}`, translations: T({ name: nm, description: ds }), price: price(m, eur), available: true })) })) },
} as B)
const link = (icon: string, title: string, desc: string): B => ({ id: bid(), type: 'link', order: 0, visible: true, seasonFilter: 'always', data: { icon, iconBg: 'red', openInNewTab: false, url: '#', translations: T({ title, description: desc }) } } as B)
const label = (text: string): B => ({ id: bid(), type: 'section_label', order: 0, visible: true, seasonFilter: 'always', data: { seasonFilter: 'always', translations: T({ text }) } } as B)
const text = (content: string): B => ({ id: bid(), type: 'text', order: 0, visible: true, seasonFilter: 'always', data: { translations: T({ content }), align: 'left', size: 'md' } } as B)

type Def = { name: string; tagline: (m: Market) => string; blocks: (m: Market) => B[]; faqs: [string, string][] }

const DEFS: Record<string, Def> = {
  psicologia: {
    name: 'Laura Gómez', tagline: m => `Psicóloga sanitaria · Consulta online y presencial en ${m.city}`,
    blocks: m => [appt(m, 'Pide tu cita', 'Elige el servicio y un horario libre', [['Primera consulta', 60, 60], ['Sesión de seguimiento', 50, 55], ['Terapia de pareja', 75, 80]], sched('10:00', '19:00', WEEK)), { id: bid(), type: 'payment_button', order: 0, visible: true, seasonFilter: 'always', data: { provider: 'auto', price: price(m, 240), currency: m.currency, translations: T({ title: 'Bono de 5 sesiones', description: 'Ahorra un 10 % pagando por adelantado' }) } } as B, faqBlock(), hours('Horario de consulta', m, sched('10:00', '19:00', WEEK)), map(m), vcard('Laura Gómez', 'Psicóloga sanitaria'), social('instagram', 'linkedin')],
    faqs: [['¿Cuánto dura la primera sesión?', 'La primera consulta dura 60 minutos. Sirve para conocernos, entender tu situación y acordar objetivos.'], ['¿Puedo hacer sesiones online?', 'Sí. Atiendo online por videollamada y también de forma presencial en la consulta.'], ['¿Cómo cancelo o cambio una cita?', 'Avísame por WhatsApp con al menos 24 horas de antelación y la movemos sin coste.'], ['¿Emitís factura?', 'Sí, se entrega factura de cada sesión, válida para reembolso de seguros.']],
  },
  abogacia: {
    name: 'Martín & Ríos Abogados', tagline: m => `Derecho civil, laboral y de familia · ${m.city}`,
    blocks: m => [text('Te escuchamos y te explicamos tus opciones con claridad, sin tecnicismos ni letra pequeña.'), appt(m, 'Reserva tu consulta', 'Primera orientación para entender tu caso', [['Primera consulta (30 min)', 30, 40], ['Consulta extendida', 60, 90], ['Revisión de contrato', 45, 120]], sched('09:30', '18:30', WEEK), 30), label('Áreas de práctica'), link('⚖️', 'Derecho laboral', 'Despidos, finiquitos y reclamaciones'), link('👪', 'Derecho de familia', 'Divorcios, custodia y herencias'), faqBlock(), hours('Horario del despacho', m, sched('09:30', '18:30', WEEK)), map(m), vcard('Martín & Ríos Abogados', 'Despacho de abogados')],
    faqs: [['¿La primera consulta tiene coste?', 'La primera orientación de 30 minutos tiene una tarifa reducida y se descuenta si decides contratarnos.'], ['¿Qué documentación debo llevar?', 'Cualquier contrato, carta o notificación relacionada con tu caso. Si no lo tienes todo, empezamos con lo que haya.'], ['¿Atendéis por videollamada?', 'Sí, puedes hacer la consulta por videollamada sin desplazarte.']],
  },
  fisioterapia: {
    name: 'Clínica Movimiento', tagline: m => `Fisioterapia y readaptación deportiva · ${m.city}`,
    blocks: m => [appt(m, 'Pide cita', 'Selecciona tu tratamiento', [['Valoración inicial', 45, 45], ['Sesión de fisioterapia', 45, 40], ['Punción seca', 30, 45], ['Readaptación deportiva', 60, 55]], sched('09:00', '20:00', WEEK, ['09:00', '13:00'])), label('Cómo trabajamos'), text('Empezamos siempre con una valoración para diseñar un plan a tu medida y explicarte cada paso.'), faqBlock(), hours('Horario', m, sched('09:00', '20:00', WEEK, ['09:00', '13:00'])), map(m), contact(m, 'Hola, quisiera pedir cita'), social('instagram', 'facebook')],
    faqs: [['¿Necesito derivación médica?', 'No es necesaria. Si tienes un informe médico o pruebas, tráelos para ajustar mejor el tratamiento.'], ['¿Cuántas sesiones necesitaré?', 'Depende de cada caso. En la valoración inicial te damos una estimación realista.'], ['¿Aceptáis seguros?', 'Trabajamos con varias mutuas. Escríbenos con los datos de tu póliza y lo confirmamos.']],
  },
  peluqueria: {
    name: 'Estudio Lumbre', tagline: m => `Peluquería y color · ${m.city}`,
    blocks: m => [appt(m, 'Reserva tu hora', 'Elige servicio, día y horario', [['Corte', 45, 25], ['Corte y peinado', 60, 35], ['Color completo', 120, 70], ['Mechas / balayage', 150, 110]], sched('10:00', '20:00', [2, 3, 4, 5], ['09:30', '15:00']), 30), hours('Horario del salón', m, sched('10:00', '20:00', [2, 3, 4, 5], ['09:30', '15:00'])), label('Nuestro trabajo'), link('📸', 'Galería de trabajos', 'Mira algunos de nuestros últimos cambios'), faqBlock(), contact(m, 'Hola, quería reservar una hora'), map(m), social('instagram', 'tiktok')],
    faqs: [['¿Cómo cancelo una reserva?', 'Avísanos por WhatsApp con 24 horas de antelación y la cambiamos sin problema.'], ['¿Trabajáis con productos veganos?', 'Sí, tenemos línea vegana y sin amoníaco. Pídela al reservar.'], ['¿Hago una prueba de color antes?', 'En cambios de color importantes hacemos una consulta previa gratuita de 15 minutos.']],
  },
  entrenamiento: {
    name: 'Nico Fit', tagline: m => `Entrenador personal · Fuerza y movilidad · ${m.city}`,
    blocks: m => [appt(m, 'Reserva tu sesión', 'Empieza con una sesión de prueba', [['Sesión de prueba', 45, 15], ['Entrenamiento personal', 60, 40], ['Entrenamiento en pareja', 60, 55]], sched('07:00', '21:00', WEEK), 60), { id: bid(), type: 'payment_button', order: 0, visible: true, seasonFilter: 'always', data: { provider: 'auto', price: price(m, 150), currency: m.currency, translations: T({ title: 'Bono de 5 sesiones', description: 'Válido 2 meses' }) } } as B, label('Horario de clases'), hours('Clases en grupo', m, sched('07:30', '20:30', WEEK)), faqBlock(), contact(m, 'Hola Nico, me gustaría probar una sesión'), social('instagram', 'youtube')],
    faqs: [['¿Necesito experiencia previa?', 'No. Adapto cada sesión a tu nivel y a tus objetivos, sea cual sea tu punto de partida.'], ['¿Dónde entrenamos?', 'En estudio propio y también puedo ir a tu domicilio o al parque.'], ['¿Qué pasa si no puedo asistir?', 'Si avisas con 12 horas de antelación, la sesión se recupera sin coste.']],
  },
  clases: {
    name: 'Academia Voces', tagline: m => `Inglés y música para todas las edades · ${m.city}`,
    blocks: m => [appt(m, 'Reserva una clase de prueba', 'La primera clase es gratuita', [['Clase de prueba (inglés)', 45, undefined], ['Clase individual', 60, 25], ['Clase de música', 45, 22]], sched('16:00', '21:00', WEEK), 60), label('Tarifas'), text('Grupos reducidos de máximo 6 personas y horarios flexibles. Matrícula gratuita en el primer mes.'), faqBlock(), hours('Horario de secretaría', m, sched('10:00', '20:00', WEEK)), map(m), contact(m, 'Hola, quiero información sobre las clases'), social('instagram', 'youtube')],
    faqs: [['¿Cómo sé mi nivel?', 'En la clase de prueba hacemos una evaluación rápida y te proponemos el grupo ideal.'], ['¿Hay descuento por hermanos?', 'Sí, aplicamos un 10 % al segundo hermano.'], ['¿Se pueden recuperar las clases?', 'Las clases canceladas con 24 horas de aviso se recuperan en otro horario.']],
  },
  restaurante: {
    name: 'La Cocina de Mar', tagline: m => `Cocina mediterránea · ${m.city}`,
    blocks: m => [orders(m, 'Pide a domicilio o para recoger', 'Prepara tu pedido y lo recibimos por WhatsApp', [['Entrantes', [['Croquetas caseras', '8 unidades de jamón ibérico', 9], ['Ensalada de burrata', 'Tomate, albahaca y pesto', 11]]], ['Principales', [['Arroz de marisco', 'Para 1 persona, caldo casero', 18], ['Pulpo a la brasa', 'Con parmentier de patata', 20], ['Hamburguesa de la casa', 'Ternera, cheddar y cebolla caramelizada', 13]]], ['Postres', [['Tarta de queso', 'Al horno, estilo vasco', 6]]]], 3, 15), hours('Horario', m, sched('13:00', '23:30', [2, 3, 4, 5, 6, 0])), map(m), faqBlock(), contact(m, 'Hola, quisiera reservar una mesa'), social('instagram', 'facebook')],
    faqs: [['¿Tenéis opciones sin gluten?', 'Sí, marcamos en la carta los platos aptos para celíacos. Avísanos al pedir.'], ['¿Hasta dónde repartís?', 'Repartimos en un radio de 4 km. El envío tiene un coste reducido.'], ['¿Se puede reservar mesa?', 'Sí, escríbenos por WhatsApp con día, hora y número de personas.']],
  },
  cafeteria: {
    name: 'Café Brote', tagline: m => `Café de especialidad y pastelería · ${m.city}`,
    blocks: m => [{ id: bid(), type: 'loyalty_card', order: 0, visible: true, seasonFilter: 'always', data: { translations: T({ title: 'Tarjeta de sellos', description: 'Un sello por cada café' }), stampIcon: '☕', targetStamps: 8, rewardDescription: Object.fromEntries(LANGS.map(l => [l, l === 'es' ? 'Un café gratis' : ''])) as Record<Lang, string> } } as B, orders(m, 'Encarga para llevar', 'Escoge y pasa a recoger sin esperas', [['Café', [['Flat white', 'Doble espresso con leche texturizada', 3], ['Café de filtro', 'Origen del mes', 3]]], ['Dulces', [['Croissant de mantequilla', 'Hecho cada mañana', 2.5], ['Tarta de zanahoria', 'Porción', 4.5]]]]), hours('Horario', m, sched('08:00', '19:00', [1, 2, 3, 4, 5, 6, 0])), map(m), faqBlock(), social('instagram', 'tiktok')],
    faqs: [['¿Tenéis leches vegetales?', 'Sí: avena, soja y almendra, sin coste adicional.'], ['¿Puedo trabajar con el portátil?', 'Claro. Tenemos enchufes y wifi gratuito, y un rincón tranquilo.'], ['¿Hacéis pedidos grandes?', 'Sí, para reuniones o celebraciones. Escríbenos con 48 horas de antelación.']],
  },
  tienda: {
    name: 'Taller Raíz', tagline: m => `Cerámica y objetos hechos a mano · ${m.city}`,
    blocks: m => [orders(m, 'Compra por WhatsApp', 'Elige tus piezas y te confirmamos stock y envío', [['Vajilla', [['Taza esmaltada', 'Hecha a mano, 300 ml', 14], ['Plato llano', 'Gres esmaltado, 24 cm', 18], ['Bol pequeño', 'Ideal para desayunos', 12]]], ['Hogar', [['Jarrón alto', 'Pieza única', 38], ['Portavelas', 'Con vela de soja incluida', 16]]]], 5, 20), label('Envíos y cambios'), text('Enviamos en 48-72 horas. Si una pieza llega dañada, la reponemos sin coste.'), faqBlock(), contact(m, 'Hola, me interesa una pieza'), social('instagram', 'tiktok')],
    faqs: [['¿Hacéis envíos internacionales?', 'Sí, consúltanos el destino y te damos el coste exacto.'], ['¿Puedo encargar una pieza personalizada?', 'Sí. Cuéntanos qué necesitas y te enviamos una propuesta con plazo y precio.'], ['¿Se pueden devolver los productos?', 'Aceptamos devoluciones durante 14 días, con la pieza en perfecto estado.']],
  },
  eventos: {
    name: 'Festival Brisa', tagline: m => `Música y gastronomía al aire libre · ${m.city}`,
    blocks: m => [text('Dos días de música, comida local y buen ambiente. Plazas limitadas.'), { id: bid(), type: 'event_tickets', order: 0, visible: true, seasonFilter: 'always', data: { translations: T({ title: 'Entradas', description: 'Recibirás tu entrada con código QR por email' }), currency: m.currency, tiers: [{ id: 't1', name: 'General', price: price(m, 25) }, { id: 't2', name: 'VIP', price: price(m, 60) }] } } as B, label('Información'), hours('Apertura de puertas', m, sched('17:00', '23:59', [5, 6])), map(m), faqBlock(), social('instagram', 'tiktok')],
    faqs: [['¿Cómo recibo mi entrada?', 'Tras el pago te llega un email con un código QR que se valida en la puerta.'], ['¿Se pueden devolver las entradas?', 'Se pueden transferir a otra persona hasta 48 horas antes del evento.'], ['¿Hay zona para personas con movilidad reducida?', 'Sí, con acceso y baños adaptados. Escríbenos si necesitas ayuda.']],
  },
  turismo: {
    name: 'Rutas del Sur', tagline: m => `Excursiones y experiencias con guía local · ${m.country}`,
    blocks: m => [appt(m, 'Reserva tu experiencia', 'Elige excursión y fecha', [['Ruta de senderismo (4 h)', 240, 35], ['Atardecer en barco', 120, 45], ['Visita gastronómica', 180, 55]], sched('09:00', '19:00', [1, 2, 3, 4, 5, 6, 0]), 120), hours('Atención', m, sched('09:00', '19:00', [1, 2, 3, 4, 5, 6, 0])), label('Qué incluye'), text('Guías locales certificados, grupos reducidos, seguro y agua incluidos.'), faqBlock(), map(m), contact(m, 'Hola, quería reservar una excursión'), social('instagram', 'facebook')],
    faqs: [['¿Se puede cancelar?', 'Cancelación gratuita hasta 48 horas antes. Si el tiempo no acompaña, reprogramamos.'], ['¿Hay guías en inglés?', 'Sí, ofrecemos las rutas en español e inglés.'], ['¿Qué debo llevar?', 'Calzado cómodo, protección solar y ropa adecuada a la época del año.']],
  },
  creadores: {
    name: 'Ana Ferrer', tagline: () => 'Diseñadora de marca y web · Trabajo con proyectos de todo el mundo',
    blocks: m => [link('🎨', 'Portfolio', 'Proyectos de identidad y diseño web'), link('📝', 'Servicios', 'Identidad de marca, web y packaging'), { id: bid(), type: 'email_capture', order: 0, visible: true, seasonFilter: 'always', data: { translations: T({ headline: 'Recursos de diseño, cada mes', description: 'Un email al mes con ideas y plantillas. Sin spam.', buttonLabel: 'Quiero recibirlos' }) } } as B, appt(m, 'Reserva una llamada', 'Cuéntame tu proyecto en 30 minutos', [['Llamada de descubrimiento', 30, undefined]], sched('10:00', '17:00', WEEK), 60), faqBlock(), vcard('Ana Ferrer', 'Diseñadora de marca'), social('instagram', 'linkedin')],
    faqs: [['¿Cómo trabajas?', 'Empiezo con una llamada para entender tu proyecto y te envío una propuesta con alcance, plazos y precio cerrado.'], ['¿Cuánto tarda una identidad de marca?', 'Entre 3 y 5 semanas, según el alcance y la rapidez con la que revisemos juntos.']],
  },
}

export function buildExample(nicheSlug: string, marketId: string | undefined): ExamplePage | null {
  const niche = NICHES.find(x => x.slug === nicheSlug)
  const def = DEFS[nicheSlug]
  if (!niche || !def) return null
  const market = marketById(marketId)
  n = 0
  const blocks = def.blocks(market).map((b, i) => ({ ...b, order: i, id: `${nicheSlug}-${i}` }))
  const id = `example-${nicheSlug}-${market.id}`
  const page = {
    id, user_id: 'example', slug: `${nicheSlug}-ejemplo`, name: def.name, published: true, qr_url: null, custom_domain: null, views: 0, created_at: '', updated_at: '',
    settings: { defaultLang: 'es', enabledLangs: nicheSlug === 'turismo' ? ['es', 'en'] : ['es'], seasonMode: 'always', primaryColor: niche.color, backgroundColor: '#F7F7F5', fontFamily: 'DM Sans', showPoweredBy: false,
      profile: { tagline: def.tagline(market) }, seo: { title: '', description: '', ogImage: null, schemaType: niche.schema, noindex: true } },
    blocks,
  } as unknown as Page
  return { niche, market, page, knowledge: def.faqs.map(([q, a], i) => faq(i, q, a, id)) }
}
