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
      reviews: {
        Row: {
          id: string
          user_id: string
          rating: number
          review_text: string
          service_type: string | null
          is_featured: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rating: number
          review_text: string
          service_type?: string | null
          is_featured?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rating?: number
          review_text?: string
          service_type?: string | null
          is_featured?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      service_requests: {
        Row: {
          id: string
          user_id: string
          service_type: string
          service_price: number | null
          service_currency: string | null
          request_details: string | null
          preferred_timeline: string | null
          status: string
          payment_reference: string | null
          admin_response: string | null
          created_at: string
          updated_at: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
