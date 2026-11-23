export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          id: number
          notify_email: string
          public_email: string
          public_phone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          notify_email?: string
          public_email?: string
          public_phone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          notify_email?: string
          public_email?: string
          public_phone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_activity: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          inquiry_id: string | null
          kind: Database["public"]["Enums"]["activity_kind"]
          note: string
          occurred_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          inquiry_id?: string | null
          kind: Database["public"]["Enums"]["activity_kind"]
          note?: string
          occurred_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          inquiry_id?: string | null
          kind?: Database["public"]["Enums"]["activity_kind"]
          note?: string
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_activity_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string
          created_at: string
          email: string
          first_active_at: string
          id: string
          last_active_at: string
          marketing_opt_in: boolean
          marketing_opt_in_at: string | null
          marketing_opt_out_at: string | null
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          company?: string
          created_at?: string
          email: string
          first_active_at?: string
          id?: string
          last_active_at?: string
          marketing_opt_in?: boolean
          marketing_opt_in_at?: string | null
          marketing_opt_out_at?: string | null
          name: string
          phone?: string
          updated_at?: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          first_active_at?: string
          id?: string
          last_active_at?: string
          marketing_opt_in?: boolean
          marketing_opt_in_at?: string | null
          marketing_opt_out_at?: string | null
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_starter: boolean
          original_answer: string | null
          original_question: string | null
          pending_removal: boolean
          position: number
          question: string
          updated_at: string
          updated_by: string | null
          visible: boolean
        }
        Insert: {
          answer?: string
          created_at?: string
          id?: string
          is_starter?: boolean
          original_answer?: string | null
          original_question?: string | null
          pending_removal?: boolean
          position?: number
          question?: string
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_starter?: boolean
          original_answer?: string | null
          original_question?: string | null
          pending_removal?: boolean
          position?: number
          question?: string
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          client_id: string
          company: string
          consent_text: string
          created_at: string
          email: string
          id: string
          interest: string
          marketing_opt_in: boolean
          message: string
          name: string
          phone: string
          read_at: string | null
          replied_at: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          submission_id: string
          terms_accepted_at: string | null
        }
        Insert: {
          client_id: string
          company?: string
          consent_text?: string
          created_at?: string
          email: string
          id?: string
          interest: string
          marketing_opt_in?: boolean
          message?: string
          name: string
          phone?: string
          read_at?: string | null
          replied_at?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          submission_id: string
          terms_accepted_at?: string | null
        }
        Update: {
          client_id?: string
          company?: string
          consent_text?: string
          created_at?: string
          email?: string
          id?: string
          interest?: string
          marketing_opt_in?: boolean
          message?: string
          name?: string
          phone?: string
          read_at?: string | null
          replied_at?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          submission_id?: string
          terms_accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_products: {
        Row: {
          inquiry_id: string
          position: number
          product_id: string | null
          product_name: string
          product_sku: string
        }
        Insert: {
          inquiry_id: string
          position: number
          product_id?: string | null
          product_name: string
          product_sku?: string
        }
        Update: {
          inquiry_id?: string
          position?: number
          product_id?: string | null
          product_name?: string
          product_sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_products_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      live_copy: {
        Row: {
          key: string
          published_at: string
          text: string
        }
        Insert: {
          key: string
          published_at?: string
          text: string
        }
        Update: {
          key?: string
          published_at?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_copy_key_fkey"
            columns: ["key"]
            isOneToOne: true
            referencedRelation: "site_content"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "live_copy_key_fkey"
            columns: ["key"]
            isOneToOne: true
            referencedRelation: "site_content_editor"
            referencedColumns: ["key"]
          },
        ]
      }
      live_faqs: {
        Row: {
          answer: string
          faq_id: string
          position: number
          published_at: string
          question: string
          visible: boolean
        }
        Insert: {
          answer: string
          faq_id: string
          position: number
          published_at?: string
          question: string
          visible: boolean
        }
        Update: {
          answer?: string
          faq_id?: string
          position?: number
          published_at?: string
          question?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "live_faqs_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: true
            referencedRelation: "faq_editor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_faqs_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: true
            referencedRelation: "faqs"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string
          details: string
          id: string
          image_path: string | null
          is_sample: boolean
          name: string
          price_cents: number | null
          price_note: string
          sku: string
          slug: string
          specs: Json
          stock_status: Database["public"]["Enums"]["stock_status"]
          updated_at: string
          visible: boolean
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string
          details?: string
          id?: string
          image_path?: string | null
          is_sample?: boolean
          name: string
          price_cents?: number | null
          price_note?: string
          sku: string
          slug: string
          specs?: Json
          stock_status?: Database["public"]["Enums"]["stock_status"]
          updated_at?: string
          visible?: boolean
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string
          details?: string
          id?: string
          image_path?: string | null
          is_sample?: boolean
          name?: string
          price_cents?: number | null
          price_note?: string
          sku?: string
          slug?: string
          specs?: Json
          stock_status?: Database["public"]["Enums"]["stock_status"]
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          copy_changes: number
          faq_changes: number
          id: number
          published_at: string
          published_by: string | null
        }
        Insert: {
          copy_changes: number
          faq_changes: number
          id?: never
          published_at?: string
          published_by?: string | null
        }
        Update: {
          copy_changes?: number
          faq_changes?: number
          id?: never
          published_at?: string
          published_by?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          draft: string
          hint: string
          key: string
          label: string
          max_length: number
          multiline: boolean
          optional: boolean
          original: string
          page: string
          section: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          draft: string
          hint?: string
          key: string
          label: string
          max_length: number
          multiline?: boolean
          optional?: boolean
          original: string
          page: string
          section: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          draft?: string
          hint?: string
          key?: string
          label?: string
          max_length?: number
          multiline?: boolean
          optional?: boolean
          original?: string
          page?: string
          section?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      faq_editor: {
        Row: {
          answer: string | null
          complete: boolean | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          is_starter: boolean | null
          original_answer: string | null
          original_question: string | null
          pending_removal: boolean | null
          position: number | null
          published_answer: string | null
          published_at: string | null
          published_position: number | null
          published_question: string | null
          published_visible: boolean | null
          question: string | null
          status: string | null
          updated_at: string | null
          visible: boolean | null
        }
        Relationships: []
      }
      site_content_editor: {
        Row: {
          draft: string | null
          edited: boolean | null
          hint: string | null
          key: string | null
          label: string | null
          max_length: number | null
          multiline: boolean | null
          optional: boolean | null
          original: string | null
          page: string | null
          published: string | null
          section: string | null
          sort_order: number | null
          unpublished: boolean | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_draft_content: { Args: never; Returns: Json }
      get_storefront_content: { Args: never; Returns: Json }
      publish_site: {
        Args: never
        Returns: {
          copy_changes: number
          faq_changes: number
          id: number
          published_at: string
          published_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "publications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reorder_faqs: { Args: { p_ids: string[] }; Returns: undefined }
      submit_inquiry: { Args: { p: Json }; Returns: Json }
      sync_site_copy: { Args: { p_slots: Json }; Returns: number }
      take_rate_limit: {
        Args: { p_bucket: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
    }
    Enums: {
      activity_kind: "inquiry" | "order" | "manual"
      inquiry_status: "new" | "read" | "replied"
      stock_status: "in_stock" | "low_stock" | "out_of_stock"
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
      activity_kind: ["inquiry", "order", "manual"],
      inquiry_status: ["new", "read", "replied"],
      stock_status: ["in_stock", "low_stock", "out_of_stock"],
    },
  },
} as const

