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
      admin_settings: {
        Row: {
          id: number
          pin_hash: string
          updated_at: string
        }
        Insert: {
          id?: number
          pin_hash: string
          updated_at?: string
        }
        Update: {
          id?: number
          pin_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          cancel_token: string
          created_at: string
          customer_email: string | null
          customer_ip: string | null
          customer_name: string
          customer_phone: string
          id: string
          reminder_24h_sent: boolean
          reminder_2h_sent: boolean
          service: string
          status: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          cancel_token?: string
          created_at?: string
          customer_email?: string | null
          customer_ip?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          reminder_24h_sent?: boolean
          reminder_2h_sent?: boolean
          service: string
          status?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          cancel_token?: string
          created_at?: string
          customer_email?: string | null
          customer_ip?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          reminder_24h_sent?: boolean
          reminder_2h_sent?: boolean
          service?: string
          status?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          booking_closed: boolean
          closure_message: string
          id: number
          site_closed: boolean
          updated_at: string
        }
        Insert: {
          booking_closed?: boolean
          closure_message?: string
          id?: number
          site_closed?: boolean
          updated_at?: string
        }
        Update: {
          booking_closed?: boolean
          closure_message?: string
          id?: number
          site_closed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_cancel_appointment: {
        Args: { _id: string; _pin: string }
        Returns: undefined
      }
      admin_change_pin: {
        Args: { _new_pin: string; _old_pin: string }
        Returns: undefined
      }
      admin_cleanup_cancelled: { Args: never; Returns: number }
      admin_delete_appointment: {
        Args: { _id: string; _pin: string }
        Returns: undefined
      }
      admin_list_appointments: {
        Args: { _pin: string }
        Returns: {
          appointment_date: string
          appointment_time: string
          cancel_token: string
          created_at: string
          customer_email: string | null
          customer_ip: string | null
          customer_name: string
          customer_phone: string
          id: string
          reminder_24h_sent: boolean
          reminder_2h_sent: boolean
          service: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_set_settings: {
        Args: {
          _booking_closed: boolean
          _closure_message: string
          _pin: string
          _site_closed: boolean
        }
        Returns: undefined
      }
      book_appointment: {
        Args: {
          _date: string
          _email: string
          _ip: string
          _name: string
          _phone: string
          _service: string
          _time: string
        }
        Returns: {
          out_id: string
          out_token: string
        }[]
      }
      cancel_by_token: {
        Args: { _token: string }
        Returns: {
          message: string
          out_date: string
          out_name: string
          out_time: string
          success: boolean
        }[]
      }
      get_booked_slots: {
        Args: { _date: string }
        Returns: {
          appointment_time: string
        }[]
      }
      get_due_reminders: {
        Args: { _kind: string }
        Returns: {
          out_date: string
          out_email: string
          out_id: string
          out_name: string
          out_phone: string
          out_service: string
          out_time: string
          out_token: string
        }[]
      }
      mark_reminder_sent: {
        Args: { _id: string; _kind: string }
        Returns: undefined
      }
      verify_admin_pin: { Args: { _pin: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
