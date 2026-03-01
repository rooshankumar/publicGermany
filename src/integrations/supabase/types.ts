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
        Relationships: [
          {
            foreignKeyName: "admin_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      applications: {
        Row: {
          application_end_date: string | null
          application_method: string | null
          application_start_date: string | null
          created_at: string
          end_date: string | null
          fees_eur: string | null
          fees_eur_per_semester: number | null
          german_requirement: string | null
          id: string
          ielts_requirement: string | null
          notes: string | null
          portal_link: string | null
          portal_login_id: string | null
          portal_password: string | null
          program_name: string
          required_tests: string | null
          show_credentials_to_student: boolean
          start_date: string | null
          status: string
          university_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_end_date?: string | null
          application_method?: string | null
          application_start_date?: string | null
          created_at?: string
          end_date?: string | null
          fees_eur?: string | null
          fees_eur_per_semester?: number | null
          german_requirement?: string | null
          id?: string
          ielts_requirement?: string | null
          notes?: string | null
          portal_link?: string | null
          portal_login_id?: string | null
          portal_password?: string | null
          program_name: string
          required_tests?: string | null
          show_credentials_to_student?: boolean
          start_date?: string | null
          status?: string
          university_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_end_date?: string | null
          application_method?: string | null
          application_start_date?: string | null
          created_at?: string
          end_date?: string | null
          fees_eur?: string | null
          fees_eur_per_semester?: number | null
          german_requirement?: string | null
          id?: string
          ielts_requirement?: string | null
          notes?: string | null
          portal_link?: string | null
          portal_login_id?: string | null
          portal_password?: string | null
          program_name?: string
          required_tests?: string | null
          show_credentials_to_student?: boolean
          start_date?: string | null
          status?: string
          university_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      blogs: {
        Row: {
          author_id: string | null
          category: string
          content_markdown: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          read_time_minutes: number | null
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category: string
          content_markdown: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          read_time_minutes?: number | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          content_markdown?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          read_time_minutes?: number | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blogs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blogs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "checklist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "checklist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          inquiry_type: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          inquiry_type: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          admin_signature_url: string | null
          admin_signed_at: string | null
          contract_html: string
          contract_pdf_url: string | null
          contract_reference: string
          created_at: string
          expected_end_date: string | null
          id: string
          payment_structure: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sent_at: string | null
          service_description: string | null
          service_fee: string
          service_package: string
          service_request_id: string | null
          signed_at: string | null
          signed_contract_url: string | null
          signed_document_url: string | null
          start_date: string | null
          status: string
          student_email: string
          student_id: string
          student_name: string
          student_phone: string | null
          student_signature_url: string | null
          student_signed_at: string | null
          updated_at: string
        }
        Insert: {
          admin_signature_url?: string | null
          admin_signed_at?: string | null
          contract_html: string
          contract_pdf_url?: string | null
          contract_reference: string
          created_at?: string
          expected_end_date?: string | null
          id?: string
          payment_structure?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          service_description?: string | null
          service_fee: string
          service_package: string
          service_request_id?: string | null
          signed_at?: string | null
          signed_contract_url?: string | null
          signed_document_url?: string | null
          start_date?: string | null
          status?: string
          student_email: string
          student_id: string
          student_name: string
          student_phone?: string | null
          student_signature_url?: string | null
          student_signed_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_signature_url?: string | null
          admin_signed_at?: string | null
          contract_html?: string
          contract_pdf_url?: string | null
          contract_reference?: string
          created_at?: string
          expected_end_date?: string | null
          id?: string
          payment_structure?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          service_description?: string | null
          service_fee?: string
          service_package?: string
          service_request_id?: string | null
          signed_at?: string | null
          signed_contract_url?: string | null
          signed_document_url?: string | null
          start_date?: string | null
          status?: string
          student_email?: string
          student_id?: string
          student_name?: string
          student_phone?: string | null
          student_signature_url?: string | null
          student_signed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "v_service_requests_with_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      deadline_reminders: {
        Row: {
          application_id: string
          day_offset: number
          id: string
          sent_at: string
        }
        Insert: {
          application_id: string
          day_offset: number
          id?: string
          sent_at?: string
        }
        Update: {
          application_id?: string
          day_offset?: number
          id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadline_reminders_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          module: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          upload_path: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          module?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          upload_path: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          module?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          upload_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      emails_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          status: string
          subject: string
          template: string | null
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          status?: string
          subject: string
          template?: string | null
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          status?: string
          subject?: string
          template?: string | null
          to_email?: string
        }
        Relationships: []
      }
      emails_outbox: {
        Row: {
          created_at: string
          html: string
          id: string
          meta: Json | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          created_at?: string
          html: string
          id?: string
          meta?: Json | null
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          created_at?: string
          html?: string
          id?: string
          meta?: Json | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          meta: Json | null
          read_at: string | null
          recipient_role: string
          ref_id: string | null
          seen: boolean
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          read_at?: string | null
          recipient_role?: string
          ref_id?: string | null
          seen?: boolean
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          read_at?: string | null
          recipient_role?: string
          ref_id?: string | null
          seen?: boolean
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_additional_sections: {
        Row: {
          created_at: string
          id: string
          order_index: number | null
          profile_id: string
          section_content: string | null
          section_title: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number | null
          profile_id: string
          section_content?: string | null
          section_title: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number | null
          profile_id?: string
          section_content?: string | null
          section_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_additional_sections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_additional_sections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_certifications: {
        Row: {
          certificate_url: string | null
          created_at: string
          date: string | null
          id: string
          institution: string | null
          order_index: number | null
          profile_id: string
          title: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          date?: string | null
          id?: string
          institution?: string | null
          order_index?: number | null
          profile_id: string
          title: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          date?: string | null
          id?: string
          institution?: string | null
          order_index?: number | null
          profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_educations: {
        Row: {
          academic_highlights: string | null
          country: string
          created_at: string
          credit_system: string | null
          degree_title: string
          end_year: number
          field_of_study: string
          final_grade: string | null
          id: string
          institution: string
          key_subjects: string | null
          max_scale: number | null
          order_index: number | null
          profile_id: string
          start_year: number
          thesis_title: string | null
          total_credits: number | null
        }
        Insert: {
          academic_highlights?: string | null
          country: string
          created_at?: string
          credit_system?: string | null
          degree_title: string
          end_year: number
          field_of_study: string
          final_grade?: string | null
          id?: string
          institution: string
          key_subjects?: string | null
          max_scale?: number | null
          order_index?: number | null
          profile_id: string
          start_year: number
          thesis_title?: string | null
          total_credits?: number | null
        }
        Update: {
          academic_highlights?: string | null
          country?: string
          created_at?: string
          credit_system?: string | null
          degree_title?: string
          end_year?: number
          field_of_study?: string
          final_grade?: string | null
          id?: string
          institution?: string
          key_subjects?: string | null
          max_scale?: number | null
          order_index?: number | null
          profile_id?: string
          start_year?: number
          thesis_title?: string | null
          total_credits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_educations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_educations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_language_skills: {
        Row: {
          created_at: string
          id: string
          ielts_score: number | null
          language_name: string
          listening: Database["public"]["Enums"]["cefr_level"] | null
          mother_tongue: boolean | null
          profile_id: string
          reading: Database["public"]["Enums"]["cefr_level"] | null
          speaking: Database["public"]["Enums"]["cefr_level"] | null
          writing: Database["public"]["Enums"]["cefr_level"] | null
        }
        Insert: {
          created_at?: string
          id?: string
          ielts_score?: number | null
          language_name: string
          listening?: Database["public"]["Enums"]["cefr_level"] | null
          mother_tongue?: boolean | null
          profile_id: string
          reading?: Database["public"]["Enums"]["cefr_level"] | null
          speaking?: Database["public"]["Enums"]["cefr_level"] | null
          writing?: Database["public"]["Enums"]["cefr_level"] | null
        }
        Update: {
          created_at?: string
          id?: string
          ielts_score?: number | null
          language_name?: string
          listening?: Database["public"]["Enums"]["cefr_level"] | null
          mother_tongue?: boolean | null
          profile_id?: string
          reading?: Database["public"]["Enums"]["cefr_level"] | null
          speaking?: Database["public"]["Enums"]["cefr_level"] | null
          writing?: Database["public"]["Enums"]["cefr_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_language_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_language_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_publications: {
        Row: {
          created_at: string
          description: string | null
          doi_url: string | null
          id: string
          journal: string | null
          order_index: number | null
          profile_id: string
          title: string
          year: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          doi_url?: string | null
          id?: string
          journal?: string | null
          order_index?: number | null
          profile_id: string
          title: string
          year?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          doi_url?: string | null
          id?: string
          journal?: string | null
          order_index?: number | null
          profile_id?: string
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_publications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_publications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_recommendations: {
        Row: {
          contact: string | null
          created_at: string
          designation: string | null
          email: string | null
          id: string
          institution: string | null
          lor_link: string | null
          name: string
          order_index: number | null
          profile_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          designation?: string | null
          email?: string | null
          id?: string
          institution?: string | null
          lor_link?: string | null
          name: string
          order_index?: number | null
          profile_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          designation?: string | null
          email?: string | null
          id?: string
          institution?: string | null
          lor_link?: string | null
          name?: string
          order_index?: number | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_recommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_recommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_work_experiences: {
        Row: {
          city_country: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          job_title: string | null
          order_index: number | null
          organisation: string | null
          profile_id: string
          start_date: string | null
        }
        Insert: {
          city_country?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title?: string | null
          order_index?: number | null
          organisation?: string | null
          profile_id: string
          start_date?: string | null
        }
        Update: {
          city_country?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title?: string | null
          order_index?: number | null
          organisation?: string | null
          profile_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_work_experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_work_experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_street: string | null
          aps_pathway: Database["public"]["Enums"]["aps_pathway"] | null
          avatar_url: string | null
          bachelor_cgpa_percentage: string | null
          bachelor_credits_ects: number | null
          bachelor_degree_name: string | null
          bachelor_duration_years: number | null
          bachelor_field: string | null
          bachelor_university: string | null
          class_10_marks: string | null
          class_12_marks: string | null
          class_12_stream: string | null
          contract_reference: string | null
          country_of_education: string | null
          created_at: string
          date_of_birth: string | null
          digital_research_skills: Json | null
          full_name: string | null
          gender: string | null
          german_level: Database["public"]["Enums"]["german_level"] | null
          has_aps_certificate: boolean | null
          id: string
          ielts_toefl_score: string | null
          intake: string | null
          intended_master_course: string | null
          linkedin_url: string | null
          master_cgpa_percentage: string | null
          master_degree_name: string | null
          master_field: string | null
          nationality: string | null
          passport_number: string | null
          phone: string | null
          place_of_birth: string | null
          role: Database["public"]["Enums"]["app_role"]
          signature_date: string | null
          signature_url: string | null
          state_of_education: string | null
          updated_at: string
          user_id: string
          work_experience_field: string | null
          work_experience_years: number | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          aps_pathway?: Database["public"]["Enums"]["aps_pathway"] | null
          avatar_url?: string | null
          bachelor_cgpa_percentage?: string | null
          bachelor_credits_ects?: number | null
          bachelor_degree_name?: string | null
          bachelor_duration_years?: number | null
          bachelor_field?: string | null
          bachelor_university?: string | null
          class_10_marks?: string | null
          class_12_marks?: string | null
          class_12_stream?: string | null
          contract_reference?: string | null
          country_of_education?: string | null
          created_at?: string
          date_of_birth?: string | null
          digital_research_skills?: Json | null
          full_name?: string | null
          gender?: string | null
          german_level?: Database["public"]["Enums"]["german_level"] | null
          has_aps_certificate?: boolean | null
          id?: string
          ielts_toefl_score?: string | null
          intake?: string | null
          intended_master_course?: string | null
          linkedin_url?: string | null
          master_cgpa_percentage?: string | null
          master_degree_name?: string | null
          master_field?: string | null
          nationality?: string | null
          passport_number?: string | null
          phone?: string | null
          place_of_birth?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          signature_date?: string | null
          signature_url?: string | null
          state_of_education?: string | null
          updated_at?: string
          user_id: string
          work_experience_field?: string | null
          work_experience_years?: number | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          aps_pathway?: Database["public"]["Enums"]["aps_pathway"] | null
          avatar_url?: string | null
          bachelor_cgpa_percentage?: string | null
          bachelor_credits_ects?: number | null
          bachelor_degree_name?: string | null
          bachelor_duration_years?: number | null
          bachelor_field?: string | null
          bachelor_university?: string | null
          class_10_marks?: string | null
          class_12_marks?: string | null
          class_12_stream?: string | null
          contract_reference?: string | null
          country_of_education?: string | null
          created_at?: string
          date_of_birth?: string | null
          digital_research_skills?: Json | null
          full_name?: string | null
          gender?: string | null
          german_level?: Database["public"]["Enums"]["german_level"] | null
          has_aps_certificate?: boolean | null
          id?: string
          ielts_toefl_score?: string | null
          intake?: string | null
          intended_master_course?: string | null
          linkedin_url?: string | null
          master_cgpa_percentage?: string | null
          master_degree_name?: string | null
          master_field?: string | null
          nationality?: string | null
          passport_number?: string | null
          phone?: string | null
          place_of_birth?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          signature_date?: string | null
          signature_url?: string | null
          state_of_education?: string | null
          updated_at?: string
          user_id?: string
          work_experience_field?: string | null
          work_experience_years?: number | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          category: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean
          is_featured: boolean
          rating: number
          review_text: string
          service_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          rating: number
          review_text: string
          service_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          rating?: number
          review_text?: string
          service_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_payments: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          proof_url: string | null
          service_id: string
          status: Database["public"]["Enums"]["payment_status"]
          target_total_amount: number | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          proof_url?: string | null
          service_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          target_total_amount?: number | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          proof_url?: string | null
          service_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          target_total_amount?: number | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_payments_service_fk"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_payments_service_fk"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_service_requests_with_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          admin_response: string | null
          created_at: string
          deliverable_url: string | null
          deliverable_urls: string[] | null
          id: string
          payment_reference: string | null
          preferred_timeline: string | null
          request_details: string | null
          service_currency: string | null
          service_price: number | null
          service_type: string
          status: Database["public"]["Enums"]["service_request_status"]
          target_currency: string | null
          target_total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          deliverable_url?: string | null
          deliverable_urls?: string[] | null
          id?: string
          payment_reference?: string | null
          preferred_timeline?: string | null
          request_details?: string | null
          service_currency?: string | null
          service_price?: number | null
          service_type: string
          status?: Database["public"]["Enums"]["service_request_status"]
          target_currency?: string | null
          target_total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          deliverable_url?: string | null
          deliverable_urls?: string[] | null
          id?: string
          payment_reference?: string | null
          preferred_timeline?: string | null
          request_details?: string | null
          service_currency?: string | null
          service_price?: number | null
          service_type?: string
          status?: Database["public"]["Enums"]["service_request_status"]
          target_currency?: string | null
          target_total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      services_catalog: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          kind: string
          name: string
          price_inr: number | null
          price_range_inr: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind: string
          name: string
          price_inr?: number | null
          price_range_inr?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          price_inr?: number | null
          price_range_inr?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_favorites: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_favorites_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_favorites_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_favorites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_favorites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      student_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
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
      profile_cv_view: {
        Row: {
          additional_sections: Json | null
          certifications: Json | null
          educations: Json | null
          languages: Json | null
          personal_info: Json | null
          publications: Json | null
          recommendations: Json | null
          user_id: string | null
          work_experiences: Json | null
        }
        Relationships: []
      }
      v_service_requests_with_payments: {
        Row: {
          admin_response: string | null
          created_at: string | null
          deliverable_url: string | null
          id: string | null
          payment_admin_note: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_id: string | null
          payment_paid_at: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          preferred_timeline: string | null
          request_details: string | null
          service_currency: string | null
          service_price: number | null
          service_type: string | null
          status: Database["public"]["Enums"]["service_request_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_cv_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      admin_get_user_documents: {
        Args: { p_user_id: string }
        Returns: {
          admin_notes: string | null
          category: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          module: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          upload_path: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_email: { Args: { p_user_id: string }; Returns: string }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_admin_new: { Args: { uid: string }; Returns: boolean }
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
        | "Applied"
      aps_pathway: "stk" | "bachelor_2_semesters" | "master_applicants"
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      checklist_status: "not_started" | "in_progress" | "completed"
      german_level: "none" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2"
      notification_type:
        | "application"
        | "document"
        | "service_request"
        | "student"
        | "catalog_update"
        | "signup"
      payment_status: "pending" | "received" | "cancelled"
      service_kind: "package" | "individual"
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
        "Applied",
      ],
      aps_pathway: ["stk", "bachelor_2_semesters", "master_applicants"],
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      checklist_status: ["not_started", "in_progress", "completed"],
      german_level: ["none", "a1", "a2", "b1", "b2", "c1", "c2"],
      notification_type: [
        "application",
        "document",
        "service_request",
        "student",
        "catalog_update",
        "signup",
      ],
      payment_status: ["pending", "received", "cancelled"],
      service_kind: ["package", "individual"],
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
