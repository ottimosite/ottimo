// Generated from the live Ottimo Supabase schema.
// Source project: syeipxngeyvyynezsvxc
// Regenerate after schema changes; do not hand-edit generated definitions.

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
      audit_findings: {
        Row: {
          affected_pages: Json
          affected_resources: Json
          audit_id: string
          category: string
          confidence: string | null
          created_at: string
          effort: string | null
          evidence: Json
          evidence_status: Database["public"]["Enums"]["audit_evidence_status"]
          fingerprint: string | null
          id: string
          impact: string | null
          priority: number | null
          severity: string
          solution: string | null
          standards: Json
          status: string
          summary: string | null
          title: string
          updated_at: string
          website_id: string
          workspace_id: string
        }
        Insert: {
          affected_pages?: Json
          affected_resources?: Json
          audit_id: string
          category: string
          confidence?: string | null
          created_at?: string
          effort?: string | null
          evidence?: Json
          evidence_status?: Database["public"]["Enums"]["audit_evidence_status"]
          fingerprint?: string | null
          id?: string
          impact?: string | null
          priority?: number | null
          severity: string
          solution?: string | null
          standards?: Json
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          website_id: string
          workspace_id: string
        }
        Update: {
          affected_pages?: Json
          affected_resources?: Json
          audit_id?: string
          category?: string
          confidence?: string | null
          created_at?: string
          effort?: string | null
          evidence?: Json
          evidence_status?: Database["public"]["Enums"]["audit_evidence_status"]
          fingerprint?: string | null
          id?: string
          impact?: string | null
          priority?: number | null
          severity?: string
          solution?: string | null
          standards?: Json
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          website_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          duration_ms: number | null
          engine_version: string | null
          id: string
          result: Json
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["audit_status"]
          updated_at: string
          url: string
          website_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          engine_version?: string | null
          id?: string
          result?: Json
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          updated_at?: string
          url: string
          website_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          engine_version?: string | null
          id?: string
          result?: Json
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          updated_at?: string
          url?: string
          website_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_actions: {
        Row: {
          affected_pages: Json
          affected_resources: Json
          audit_id: string | null
          category: string
          confidence: string
          created_at: string
          dependencies: Json
          effort: string
          expected_outcome: string | null
          finding_id: string | null
          fingerprint: string | null
          id: string
          impact: string
          implementation_steps: Json
          lifecycle_status: string
          priority: Json
          priority_score: number | null
          severity: string
          status: string
          title: string
          updated_at: string
          verification: Json
          website_id: string
          work: Json
          workspace_id: string
        }
        Insert: {
          affected_pages?: Json
          affected_resources?: Json
          audit_id?: string | null
          category: string
          confidence: string
          created_at?: string
          dependencies?: Json
          effort: string
          expected_outcome?: string | null
          finding_id?: string | null
          fingerprint?: string | null
          id?: string
          impact: string
          implementation_steps?: Json
          lifecycle_status?: string
          priority?: Json
          priority_score?: number | null
          severity: string
          status?: string
          title: string
          updated_at?: string
          verification?: Json
          website_id: string
          work?: Json
          workspace_id: string
        }
        Update: {
          affected_pages?: Json
          affected_resources?: Json
          audit_id?: string | null
          category?: string
          confidence?: string
          created_at?: string
          dependencies?: Json
          effort?: string
          expected_outcome?: string | null
          finding_id?: string | null
          fingerprint?: string | null
          id?: string
          impact?: string
          implementation_steps?: Json
          lifecycle_status?: string
          priority?: Json
          priority_score?: number | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          verification?: Json
          website_id?: string
          work?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_actions_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_actions_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "audit_findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_actions_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          audit_id: string
          created_at: string
          created_by: string | null
          format: string
          id: string
          metadata: Json
          title: string
          website_id: string
          workspace_id: string
        }
        Insert: {
          audit_id: string
          created_at?: string
          created_by?: string | null
          format?: string
          id?: string
          metadata?: Json
          title: string
          website_id: string
          workspace_id: string
        }
        Update: {
          audit_id?: string
          created_at?: string
          created_by?: string | null
          format?: string
          id?: string
          metadata?: Json
          title?: string
          website_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          created_at: string
          created_by: string
          id: string
          last_audit_id: string | null
          name: string
          updated_at: string
          url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          last_audit_id?: string | null
          name: string
          updated_at?: string
          url: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          last_audit_id?: string | null
          name?: string
          updated_at?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_last_audit_fk"
            columns: ["last_audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "websites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_member_role"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_member_role"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_member_role"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_workspace_admin: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      audit_evidence_status: "measured" | "inferred" | "unavailable"
      audit_status: "queued" | "running" | "completed" | "failed" | "cancelled"
      workspace_member_role: "owner" | "admin" | "member" | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      audit_evidence_status: ["measured", "inferred", "unavailable"],
      audit_status: ["queued", "running", "completed", "failed", "cancelled"],
      workspace_member_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const

