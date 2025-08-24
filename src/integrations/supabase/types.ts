export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          note: string
          student_id: string
          visibility: Database["public"]["Enums"]["admin_note_visibility"]
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          note: string
          student_id: string
          visibility?: Database["public"]["Enums"]["admin_note_visibility"]
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          note?: string
          student_id?: string
          visibility?: Database["public"]["Enums"]["admin_note_visibility"]
        }
        Relationships: []
      }
      applications: {
        Row: {
          application_method: string | null
          created_at: string
          end_date: string | null
          fees_eur: number | null
          german_requirement: string | null
          id: string
          ielts_requirement: string | null
          notes: string | null
          portal_link: string | null
          program_name: string
          required_tests: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["application_status"]
          university_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_method?: string | null
          created_at?: string
          end_date?: string | null
          fees_eur?: number | null
          german_requirement?: string | null
          id?: string
          ielts_requirement?: string | null
          notes?: string | null
          portal_link?: string | null
          program_name: string
          required_tests?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          university_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_method?: string | null
          created_at?: string
          end_date?: string | null
          fees_eur?: number | null
          german_requirement?: string | null
          id?: string
          ielts_requirement?: string | null
          notes?: string | null
          portal_link?: string | null
          program_name?: string
          required_tests?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          university_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          created_at: string
          file_id: string | null
          id: string
          item_name: string
          module: string
          notes: string | null
          status: Database["public"]["Enums"]["checklist_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_id?: string | null
          id?: string
          item_name: string
          module: string
          notes?: string | null
          status?: Database["public"]["Enums"]["checklist_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_id?: string | null
          id?: string
          item_name?: string
          module?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["checklist_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          mime_type: string | null
          module: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          module?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          module?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aps_pathway: Database["public"]["Enums"]["aps_pathway"] | null
          bachelor_cgpa_percentage: string | null
          bachelor_credits_ects: number | null
          bachelor_degree_name: string | null
          bachelor_duration_years: number | null
          bachelor_field: string | null
          class_10_marks: string | null
          class_12_marks: string | null
          class_12_stream: string | null
          country_of_education: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          german_level: Database["public"]["Enums"]["german_level"] | null
          id: string
          ielts_toefl_score: string | null
          master_cgpa_percentage: string | null
          master_degree_name: string | null
          master_field: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
          work_experience_field: string | null
          work_experience_years: number | null
        }
        Insert: {
          aps_pathway?: Database["public"]["Enums"]["aps_pathway"] | null
          bachelor_cgpa_percentage?: string | null
          bachelor_credits_ects?: number | null
          bachelor_degree_name?: string | null
          bachelor_duration_years?: number | null
          bachelor_field?: string | null
          class_10_marks?: string | null
          class_12_marks?: string | null
          class_12_stream?: string | null
          country_of_education?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          german_level?: Database["public"]["Enums"]["german_level"] | null
          id?: string
          ielts_toefl_score?: string | null
          master_cgpa_percentage?: string | null
          master_degree_name?: string | null
          master_field?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
          work_experience_field?: string | null
          work_experience_years?: number | null
        }
        Update: {
          aps_pathway?: Database["public"]["Enums"]["aps_pathway"] | null
          bachelor_cgpa_percentage?: string | null
          bachelor_credits_ects?: number | null
          bachelor_degree_name?: string | null
          bachelor_duration_years?: number | null
          bachelor_field?: string | null
          class_10_marks?: string | null
          class_12_marks?: string | null
          class_12_stream?: string | null
          country_of_education?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          german_level?: Database["public"]["Enums"]["german_level"] | null
          id?: string
          ielts_toefl_score?: string | null
          master_cgpa_percentage?: string | null
          master_degree_name?: string | null
          master_field?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
          work_experience_field?: string | null
          work_experience_years?: number | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          payment_reference: string | null
          preferred_timeline: string | null
          request_details: string | null
          service_currency: string | null
          service_price: number | null
          service_type: string
          status: Database["public"]["Enums"]["service_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          payment_reference?: string | null
          preferred_timeline?: string | null
          request_details?: string | null
          service_currency?: string | null
          service_price?: number | null
          service_type: string
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          payment_reference?: string | null
          preferred_timeline?: string | null
          request_details?: string | null
          service_currency?: string | null
          service_price?: number | null
          service_type?: string
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          fields: string[] | null
          has_tuition_fees: boolean | null
          id: string
          is_public: boolean | null
          languages: string[] | null
          name: string
          website_url: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          fields?: string[] | null
          has_tuition_fees?: boolean | null
          id?: string
          is_public?: boolean | null
          languages?: string[] | null
          name: string
          website_url?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          fields?: string[] | null
          has_tuition_fees?: boolean | null
          id?: string
          is_public?: boolean | null
          languages?: string[] | null
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      admin_note_visibility: "admin_only" | "shared"
      app_role: "student" | "admin"
      application_status:
        | "draft"
        | "submitted"
        | "interview"
        | "offer"
        | "rejected"
      aps_pathway: "stk" | "bachelor_2_semesters" | "master_applicants"
      checklist_status: "not_started" | "in_progress" | "completed"
      german_level: "none" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2"
      service_request_status:
        | "new"
        | "in_review"
        | "payment_pending"
        | "in_progress"
        | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_note_visibility: ["admin_only", "shared"],
      app_role: ["student", "admin"],
      application_status: [
        "draft",
        "submitted",
        "interview",
        "offer",
        "rejected",
      ],
      aps_pathway: ["stk", "bachelor_2_semesters", "master_applicants"],
      checklist_status: ["not_started", "in_progress", "completed"],
      german_level: ["none", "a1", "a2", "b1", "b2", "c1", "c2"],
      service_request_status: [
        "new",
        "in_review",
        "payment_pending",
        "in_progress",
        "completed",
      ],
    },
  },
} as const
