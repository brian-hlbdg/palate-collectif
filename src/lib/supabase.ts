import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Type-safe database helpers will be added here
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          eventbrite_email: string | null
          is_temp_account: boolean
          account_expires_at: string | null
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          eventbrite_email?: string | null
          is_temp_account?: boolean
          account_expires_at?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          eventbrite_email?: string | null
          is_temp_account?: boolean
          account_expires_at?: string | null
          is_admin?: boolean
          created_at?: string
        }
      }
      tasting_events: {
        Row: {
          id: string
          event_code: string
          event_name: string
          event_date: string
          location: string | null
          description: string | null
          admin_id: string
          is_active: boolean
          event_type: 'wine_crawl' | 'booth'
          created_at: string
          booth_logo_url: string | null
          booth_primary_color: string | null
          booth_welcome_message: string | null
        }
        Insert: {
          id?: string
          event_code: string
          event_name: string
          event_date: string
          location?: string | null
          description?: string | null
          admin_id: string
          is_active?: boolean
          event_type?: 'wine_crawl' | 'booth'
          created_at?: string
          booth_logo_url?: string | null
          booth_primary_color?: string | null
          booth_welcome_message?: string | null
        }
        Update: {
          id?: string
          event_code?: string
          event_name?: string
          event_date?: string
          location?: string | null
          description?: string | null
          admin_id?: string
          is_active?: boolean
          event_type?: 'wine_crawl' | 'booth'
          created_at?: string
          booth_logo_url?: string | null
          booth_primary_color?: string | null
          booth_welcome_message?: string | null
        }
      }
      event_wines: {
        Row: {
          id: string
          event_id: string
          wine_name: string
          producer: string | null
          vintage: string | null
          wine_type: string
          beverage_type: string
          region: string | null
          country: string | null
          price_point: string | null
          alcohol_content: string | null
          sommelier_notes: string | null
          image_url: string | null
          tasting_order: number
          location_id: string | null
          grape_varieties: unknown | null
          wine_style: string[] | null
          food_pairings: unknown | null
          tasting_notes: unknown | null
          technical_details: unknown | null
          awards: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          wine_name: string
          producer?: string | null
          vintage?: string | null
          wine_type?: string
          beverage_type?: string
          region?: string | null
          country?: string | null
          price_point?: string | null
          alcohol_content?: string | null
          sommelier_notes?: string | null
          image_url?: string | null
          tasting_order?: number
          location_id?: string | null
          grape_varieties?: unknown | null
          wine_style?: string[] | null
          food_pairings?: unknown | null
          tasting_notes?: unknown | null
          technical_details?: unknown | null
          awards?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          wine_name?: string
          producer?: string | null
          vintage?: string | null
          wine_type?: string
          beverage_type?: string
          region?: string | null
          country?: string | null
          price_point?: string | null
          alcohol_content?: string | null
          sommelier_notes?: string | null
          image_url?: string | null
          tasting_order?: number
          location_id?: string | null
          grape_varieties?: unknown | null
          wine_style?: string[] | null
          food_pairings?: unknown | null
          tasting_notes?: unknown | null
          technical_details?: unknown | null
          awards?: string[] | null
          created_at?: string
        }
      }
      user_ratings: {
        Row: {
          id: string
          user_id: string
          event_wine_id: string
          rating: number
          personal_notes: string | null
          is_favorite: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_wine_id: string
          rating: number
          personal_notes?: string | null
          is_favorite?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_wine_id?: string
          rating?: number
          personal_notes?: string | null
          is_favorite?: boolean
          created_at?: string
        }
      }
      event_locations: {
        Row: {
          id: string
          event_id: string
          location_name: string
          location_address: string | null
          location_order: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          location_name: string
          location_address?: string | null
          location_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          location_name?: string
          location_address?: string | null
          location_order?: number
          created_at?: string
        }
      }
    }
  }
}
