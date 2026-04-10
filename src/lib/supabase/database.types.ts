export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'pro' | 'agency'
          plan_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'agency'
          plan_expires_at?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'agency'
          plan_expires_at?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          id: string
          user_id: string
          slug: string
          name: string
          settings: Json
          blocks: Json
          published: boolean
          qr_url: string | null
          custom_domain: string | null
          views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          slug: string
          name: string
          settings?: Json
          blocks?: Json
          published?: boolean
          qr_url?: string | null
          custom_domain?: string | null
        }
        Update: {
          slug?: string
          name?: string
          settings?: Json
          blocks?: Json
          published?: boolean
          qr_url?: string | null
          custom_domain?: string | null
        }
        Relationships: [{ foreignKeyName: 'pages_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] }]
      }
      analytics_events: {
        Row: {
          id: string
          page_id: string
          event_type: 'view' | 'click'
          block_id: string | null
          block_type: string | null
          url: string | null
          lang: string
          country: string | null
          device: 'mobile' | 'tablet' | 'desktop' | null
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          page_id: string
          event_type: 'view' | 'click'
          block_id?: string | null
          block_type?: string | null
          url?: string | null
          lang?: string
          country?: string | null
          device?: 'mobile' | 'tablet' | 'desktop' | null
          referrer?: string | null
        }
        Update: never
        Relationships: [{ foreignKeyName: 'analytics_events_page_id_fkey'; columns: ['page_id']; referencedRelation: 'pages'; referencedColumns: ['id'] }]
      }
      custom_domains: {
        Row: {
          id: string
          page_id: string
          domain: string
          verified: boolean
          txt_record: string | null
          created_at: string
        }
        Insert: { id?: string; page_id: string; domain: string; verified?: boolean; txt_record?: string | null }
        Update: { verified?: boolean; txt_record?: string | null }
        Relationships: []
      }
    }
    Views: {
      pages_summary: {
        Row: {
          id: string | null
          user_id: string | null
          slug: string | null
          name: string | null
          published: boolean | null
          views: number | null
          primary_color: string | null
          default_lang: string | null
          block_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      analytics_summary: {
        Row: {
          page_id: string | null
          views_30d: number | null
          clicks_30d: number | null
          countries: number | null
          day: string | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type PublicSchema = Database['public']
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type Views<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
