export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string
          name: string
          slug: string
          formatted_address: string
          city: string
          state: string
          rating: number
          user_ratings_total: number
          reviews_link: string | null
          website: string | null
          formatted_phone_number: string | null
          email: string | null
          working_hours: Json | null
          menu_link: string | null
          order_links: string | null
          photos: Json | null
          tags: string[] | null
          about: string | null
          is_premium: boolean
          featured_until: string | null
          featured_logo: string | null
          owner_id: string | null
          featured_order_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          formatted_address: string
          city: string
          state: string
          rating?: number
          user_ratings_total?: number
          reviews_link?: string | null
          website?: string | null
          formatted_phone_number?: string | null
          email?: string | null
          working_hours?: Json | null
          menu_link?: string | null
          order_links?: string | null
          photos?: Json | null
          tags?: string[] | null
          about?: string | null
          is_premium?: boolean
          featured_until?: string | null
          featured_logo?: string | null
          owner_id?: string | null
          featured_order_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          formatted_address?: string
          city?: string
          state?: string
          rating?: number
          user_ratings_total?: number
          reviews_link?: string | null
          website?: string | null
          formatted_phone_number?: string | null
          email?: string | null
          working_hours?: Json | null
          menu_link?: string | null
          order_links?: string | null
          photos?: Json | null
          tags?: string[] | null
          about?: string | null
          is_premium?: boolean
          featured_until?: string | null
          featured_logo?: string | null
          owner_id?: string | null
          featured_order_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          shop_id: string
          shop_slug: string
          user_name: string
          user_email: string
          rating: number
          comment: string
          date: string
          is_verified: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          shop_slug: string
          user_name: string
          user_email: string
          rating: number
          comment: string
          date?: string
          is_verified?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          shop_slug?: string
          user_name?: string
          user_email?: string
          rating?: number
          comment?: string
          date?: string
          is_verified?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shop_claim_requests: {
        Row: {
          id: string
          shop_id: string
          user_id: string
          status: string
          message: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          user_id: string
          status: string
          message?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          user_id?: string
          status?: string
          message?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          shop_id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan_type: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan_type: string
          status: string
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          plan_type?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
