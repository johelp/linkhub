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
          plan: 'free' | 'pro'
          plan_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro'
          plan_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro'
          plan_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
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
      email_subscribers: {
        Row: {
          id: string
          page_id: string
          email: string
          lang: string
          created_at: string
        }
        Insert: { id?: string; page_id: string; email: string; lang?: string }
        Update: never
        Relationships: [{ foreignKeyName: 'email_subscribers_page_id_fkey'; columns: ['page_id']; referencedRelation: 'pages'; referencedColumns: ['id'] }]
      }
      payment_connections: {
        Row: {
          id: string
          user_id: string
          provider: string
          provider_user_id: string
          access_token: string
          refresh_token: string
          public_key: string | null
          live_mode: boolean
          connected_at: string
        }
        Insert: {
          id?: string; user_id: string; provider?: string; provider_user_id: string
          access_token: string; refresh_token: string; public_key?: string | null; live_mode?: boolean
        }
        Update: { access_token?: string; refresh_token?: string; public_key?: string | null; live_mode?: boolean }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          page_id: string
          block_id: string
          provider: string
          status: 'pending' | 'approved' | 'rejected' | 'refunded'
          amount: number
          currency: string
          provider_payment_id: string | null
          provider_preference_id: string | null
          payer_email: string | null
          tier_id: string | null
          tier_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string; page_id: string; block_id: string; provider?: string
          status?: 'pending' | 'approved' | 'rejected' | 'refunded'
          amount: number; currency: string
          provider_payment_id?: string | null; provider_preference_id?: string | null; payer_email?: string | null
          tier_id?: string | null; tier_name?: string | null
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected' | 'refunded'
          provider_payment_id?: string | null; provider_preference_id?: string | null; payer_email?: string | null
        }
        Relationships: [{ foreignKeyName: 'payments_page_id_fkey'; columns: ['page_id']; referencedRelation: 'pages'; referencedColumns: ['id'] }]
      }
      tickets: {
        Row: {
          id: string
          payment_id: string
          page_id: string
          tier_id: string
          tier_name: string
          code: string
          buyer_email: string | null
          status: 'issued' | 'used' | 'cancelled'
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string; payment_id: string; page_id: string; tier_id: string; tier_name: string
          code: string; buyer_email?: string | null; status?: 'issued' | 'used' | 'cancelled'
        }
        Update: { status?: 'issued' | 'used' | 'cancelled'; used_at?: string | null }
        Relationships: [
          { foreignKeyName: 'tickets_page_id_fkey'; columns: ['page_id']; referencedRelation: 'pages'; referencedColumns: ['id'] },
          { foreignKeyName: 'tickets_payment_id_fkey'; columns: ['payment_id']; referencedRelation: 'payments'; referencedColumns: ['id'] },
        ]
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
