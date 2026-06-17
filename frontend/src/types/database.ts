export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface TemplateExercise {
  name: string
  sets: number
  warmupSets?: number
  defaultReps: number
  type?: 'reps' | 'timer'
  defaultDuration?: number
}

export type GenericRelationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          level: number
          xp: number
          streak_days: number
          last_workout_date: string | null
          weekly_schedule: Record<string, string>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          level?: number
          xp?: number
          streak_days?: number
          last_workout_date?: string | null
          weekly_schedule?: Record<string, string>
        }
        Update: {
          username?: string
          level?: number
          xp?: number
          streak_days?: number
          last_workout_date?: string | null
          weekly_schedule?: Record<string, string>
        }
        Relationships: GenericRelationship[]
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
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          template_id?: string | null
          name: string
          started_at: string
          completed_at?: string | null
          xp_earned?: number
          notes?: string | null
        }
        Update: {
          completed_at?: string | null
          xp_earned?: number
          notes?: string | null
        }
        Relationships: GenericRelationship[]
      }
      workout_templates: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          is_public: boolean
          program_type: string | null
          exercises_data: TemplateExercise[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          name: string
          description?: string | null
          is_public?: boolean
          program_type?: string | null
          exercises_data?: TemplateExercise[]
        }
        Update: {
          name?: string
          description?: string | null
          is_public?: boolean
          program_type?: string | null
          exercises_data?: TemplateExercise[]
        }
        Relationships: GenericRelationship[]
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
        Insert: {
          session_id: string
          name: string
          sets: number
          reps?: number | null
          weight_kg?: number | null
          duration_seconds?: number | null
          order_index?: number
        }
        Update: {
          name?: string
          sets?: number
          reps?: number | null
          weight_kg?: number | null
          order_index?: number
        }
        Relationships: GenericRelationship[]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
