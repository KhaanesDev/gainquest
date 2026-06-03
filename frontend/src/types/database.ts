export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          level: number
          xp: number
          total_gaming_minutes: number
          available_gaming_minutes: number
          streak_days: number
          last_workout_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          name: string
          started_at: string
          completed_at: string | null
          xp_earned: number
          gaming_minutes_earned: number
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>
      }
      workout_templates: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          is_public: boolean
          program_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workout_templates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workout_templates']['Insert']>
      }
      exercises: {
        Row: {
          id: string
          session_id: string
          name: string
          sets: number
          reps: number | null
          weight_kg: number | null
          duration_seconds: number | null
          order_index: number
        }
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
