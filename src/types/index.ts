// ─── Plans ──────────────────────────────────────────────────────
export type Plan = 'free' | 'pro'

export type BlockType =
  | 'link'
  | 'expandable'
  | 'featured'
  | 'section_label'
  | 'social_grid'
  | 'contact_card'
  | 'divider'
  | 'image_banner'
  | 'video_embed'
  | 'email_capture'
  | 'payment_button'
  | 'event_tickets'
  | 'business_hours'
  | 'google_reviews'
  | 'text'

// Blocks available without paying
export const FREE_BLOCKS: BlockType[] = ['link', 'section_label', 'divider']

export function blockRequiresPro(type: BlockType): boolean {
  return !FREE_BLOCKS.includes(type)
}

export interface PlanLimits {
  pages: number
  advancedBlocks: boolean      // featured, expandable, social_grid, contact_card, image_banner, text
  multiLanguage: boolean        // > 1 language
  seasonFilter: boolean         // winter / summer / off on blocks
  customQR: boolean
  customDomain: boolean
  analytics: 'basic' | 'full' | 'full+export'
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    pages: 1,
    advancedBlocks: false,
    multiLanguage: false,
    seasonFilter: false,
    customQR: false,
    customDomain: false,
    analytics: 'basic',
  },
  pro: {
    pages: 999,
    advancedBlocks: true,
    multiLanguage: true,
    seasonFilter: true,
    customQR: true,
    customDomain: true,
    analytics: 'full+export',
  },
}

// ─── User / Profile ─────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: Plan
  plan_expires_at: string | null
  created_at: string
}

// ─── Page ───────────────────────────────────────────────────────
export type SeasonMode = 'winter' | 'summer' | 'off' | 'always'
export type Lang = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it'

export interface PageSettings {
  defaultLang: Lang
  enabledLangs: Lang[]
  seasonMode: SeasonMode
  primaryColor: string
  backgroundColor: string
  fontFamily: string
  showPoweredBy: boolean
  seo: {
    title: string
    description: string
    ogImage: string | null
  }
  pixels?: {
    ga4Id?: string        // "G-XXXXXXXXXX"
    metaPixelId?: string  // numeric Meta/Facebook Pixel ID
  }
}

export interface Page {
  id: string
  user_id: string
  slug: string
  name: string
  settings: PageSettings
  blocks: Block[]
  published: boolean
  qr_url: string | null
  custom_domain: string | null
  views: number
  created_at: string
  updated_at: string
}

// ─── Blocks ─────────────────────────────────────────────────────
export interface BlockBase {
  id: string
  type: BlockType
  order: number
  visible: boolean
  seasonFilter: SeasonMode | 'always'
}

export interface LinkBlock extends BlockBase {
  type: 'link'
  data: {
    icon: string
    iconBg: string
    translations: Record<Lang, { title: string; description: string }>
    url: string
    openInNewTab: boolean
  }
}

export interface ExpandableBlock extends BlockBase {
  type: 'expandable'
  data: {
    icon: string
    translations: Record<Lang, { title: string; subtitle: string }>
    children: ExpandableChild[]
  }
}

export interface ExpandableChild {
  id: string
  icon: string
  translations: Record<Lang, { label: string; price?: string }>
  url: string
  children?: ExpandableChild[]
}

export interface FeaturedBlock extends BlockBase {
  type: 'featured'
  data: {
    icon: string
    badge: Record<Lang, string>
    translations: Record<Lang, { title: string; description: string }>
    url: string
    colorScheme: string
    customColor?: string
  }
}

export interface SectionLabelBlock extends BlockBase {
  type: 'section_label'
  data: {
    translations: Record<Lang, { text: string }>
    seasonFilter: SeasonMode | 'always'
  }
}

export interface SocialGridBlock extends BlockBase {
  type: 'social_grid'
  data: {
    items: Array<{
      id: string
      platform: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin' | 'whatsapp'
      url: string
      label: string
    }>
  }
}

export interface ContactCardBlock extends BlockBase {
  type: 'contact_card'
  data: {
    phone?: string
    email?: string
    address?: string
    mapUrl?: string
    whatsapp?: string
    whatsappMessage?: string
  }
}

// 0 = Sunday ... 6 = Saturday, matching Date#getDay().
export interface DaySchedule {
  day: number
  closed: boolean
  open: string   // "HH:MM", 24h
  close: string  // "HH:MM", 24h
}

export interface BusinessHoursBlock extends BlockBase {
  type: 'business_hours'
  data: {
    translations: Record<Lang, { title: string }>
    timezone: string   // IANA tz, e.g. "America/Argentina/Buenos_Aires"
    schedule: DaySchedule[]
  }
}

export interface GoogleReviewsBlock extends BlockBase {
  type: 'google_reviews'
  data: {
    translations: Record<Lang, { title: string }>
    rating: number         // 0-5, entered by the owner (no live API — see SETUP.md)
    reviewCount: number
    mapsUrl?: string        // link to the Google Maps listing, to view all reviews
    placeId?: string        // enables the "leave a review" deep link (Google's own writereview URL)
  }
}

export interface ImageBannerBlock extends BlockBase {
  type: 'image_banner'
  data: {
    imageUrl: string
    altText: string
    url?: string
    aspectRatio: '16:9' | '4:3' | '1:1' | '3:1'
  }
}

export interface TextBlock extends BlockBase {
  type: 'text'
  data: {
    translations: Record<Lang, { content: string }>
    align: 'left' | 'center' | 'right'
    size: 'sm' | 'md' | 'lg'
  }
}

export interface DividerBlock extends BlockBase {
  type: 'divider'
  data: { style: 'line' | 'dots' | 'space'; spacing: 'sm' | 'md' | 'lg' }
}

export interface VideoEmbedBlock extends BlockBase {
  type: 'video_embed'
  data: {
    url: string          // YouTube, Vimeo, or a direct .mp4/.webm/.mov link
    caption?: string
    aspectRatio: '16:9' | '9:16' | '1:1'
  }
}

export interface EmailCaptureBlock extends BlockBase {
  type: 'email_capture'
  data: {
    translations: Record<Lang, { headline: string; description: string; buttonLabel: string }>
  }
}

export interface PaymentButtonBlock extends BlockBase {
  type: 'payment_button'
  data: {
    translations: Record<Lang, { title: string; description: string }>
    price: number
    currency: string   // ISO currency code Mercado Pago accepts, e.g. 'ARS', 'MXN', 'CLP'
  }
}

export interface TicketTier {
  id: string
  name: string
  price: number
}

export interface EventTicketsBlock extends BlockBase {
  type: 'event_tickets'
  data: {
    translations: Record<Lang, { title: string; description: string }>
    tiers: TicketTier[]
    currency: string
  }
}

export type Block =
  | LinkBlock | ExpandableBlock | FeaturedBlock
  | SectionLabelBlock | SocialGridBlock | ContactCardBlock
  | ImageBannerBlock | VideoEmbedBlock | EmailCaptureBlock | PaymentButtonBlock | EventTicketsBlock
  | BusinessHoursBlock | GoogleReviewsBlock | TextBlock | DividerBlock

// ─── Analytics ──────────────────────────────────────────────────
export interface AnalyticsEvent {
  id: string
  page_id: string
  event_type: 'view' | 'click'
  block_id?: string
  block_type?: BlockType
  url?: string
  lang: string
  country?: string
  device?: 'mobile' | 'tablet' | 'desktop'
  created_at: string
}
