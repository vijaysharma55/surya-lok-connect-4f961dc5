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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          aadhaar: string
          admin_notes: string | null
          application_code: string
          approved_at: string | null
          block: string
          created_at: string
          district: string
          email: string | null
          full_name: string
          id: string
          mobile: string
          panchayat: string
          payment_amount: number
          payment_screenshot_url: string
          photo_url: string | null
          post: string
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          aadhaar: string
          admin_notes?: string | null
          application_code?: string
          approved_at?: string | null
          block: string
          created_at?: string
          district: string
          email?: string | null
          full_name: string
          id?: string
          mobile: string
          panchayat: string
          payment_amount?: number
          payment_screenshot_url: string
          photo_url?: string | null
          post: string
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          aadhaar?: string
          admin_notes?: string | null
          application_code?: string
          approved_at?: string | null
          block?: string
          created_at?: string
          district?: string
          email?: string | null
          full_name?: string
          id?: string
          mobile?: string
          panchayat?: string
          payment_amount?: number
          payment_screenshot_url?: string
          photo_url?: string | null
          post?: string
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string
          service: string
          source: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          phone: string
          service: string
          source?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string
          service?: string
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          created_at: string
          filename: string
          height: number | null
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          filename: string
          height?: number | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          membership_type: string
          notes: string | null
          payment_status: string
          phone_number: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          membership_type?: string
          notes?: string | null
          payment_status?: string
          phone_number: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          membership_type?: string
          notes?: string | null
          payment_status?: string
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          body: string | null
          created_at: string
          cta_label: string | null
          cta_link: string | null
          data: Json
          heading: string | null
          id: string
          image_url: string | null
          page_id: string
          section_key: string
          section_type: string
          sort_order: number
          subheading: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          data?: Json
          heading?: string | null
          id?: string
          image_url?: string | null
          page_id: string
          section_key: string
          section_type: string
          sort_order?: number
          subheading?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          data?: Json
          heading?: string | null
          id?: string
          image_url?: string | null
          page_id?: string
          section_key?: string
          section_type?: string
          sort_order?: number
          subheading?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string
          id: string
          published: boolean
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          published?: boolean
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          published?: boolean
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          canonical_url: string | null
          description: string | null
          id: string
          keywords: string | null
          og_image_url: string | null
          page_path: string
          title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          description?: string | null
          id?: string
          keywords?: string | null
          og_image_url?: string | null
          page_path: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          description?: string | null
          id?: string
          keywords?: string | null
          og_image_url?: string | null
          page_path?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          benefits: Json
          created_at: string
          cta_label: string | null
          cta_link: string | null
          description: string | null
          features: Json
          icon: string | null
          id: string
          image_url: string | null
          published: boolean
          short_description: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          benefits?: Json
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          features?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          short_description?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          benefits?: Json
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          features?: Json
          icon?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          short_description?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string | null
          brand_tagline: string | null
          compliance: Json
          cta_banner_label: string | null
          cta_banner_link: string | null
          cta_banner_text: string | null
          data: Json
          domain: string | null
          email: string | null
          favicon_url: string | null
          footer_text: string | null
          hero_cta_label: string | null
          hero_cta_link: string | null
          hero_heading: string | null
          hero_image_url: string | null
          hero_subheading: string | null
          hours: string | null
          id: string
          logo_url: string | null
          nav_links: Json
          phones: Json
          site_name: string | null
          social_links: Json
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          brand_tagline?: string | null
          compliance?: Json
          cta_banner_label?: string | null
          cta_banner_link?: string | null
          cta_banner_text?: string | null
          data?: Json
          domain?: string | null
          email?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          hero_cta_label?: string | null
          hero_cta_link?: string | null
          hero_heading?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          hours?: string | null
          id: string
          logo_url?: string | null
          nav_links?: Json
          phones?: Json
          site_name?: string | null
          social_links?: Json
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          brand_tagline?: string | null
          compliance?: Json
          cta_banner_label?: string | null
          cta_banner_link?: string | null
          cta_banner_text?: string | null
          data?: Json
          domain?: string | null
          email?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          hero_cta_label?: string | null
          hero_cta_link?: string | null
          hero_heading?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          hours?: string | null
          id?: string
          logo_url?: string | null
          nav_links?: Json
          phones?: Json
          site_name?: string | null
          social_links?: Json
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gen_application_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
