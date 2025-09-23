import { createClient } from '@supabase/supabase-js'

// These will be your Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema types matching our existing structure
export interface Database {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          created_at: string
          priority: 'low' | 'medium' | 'high'
          tags: string[]
          status: 'parking' | 'in-pipeline' | 'completed' | 'archived'
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          created_at?: string
          priority: 'low' | 'medium' | 'high'
          tags: string[]
          status: 'parking' | 'in-pipeline' | 'completed' | 'archived'
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          created_at?: string
          priority?: 'low' | 'medium' | 'high'
          tags?: string[]
          status?: 'parking' | 'in-pipeline' | 'completed' | 'archived'
        }
      }
      execution_pipelines: {
        Row: {
          id: string
          user_id: string
          idea_id: string
          current_stage: number
          stages: any[]
          created_at: string
          updated_at: string
          notes: string
        }
        Insert: {
          id?: string
          user_id: string
          idea_id: string
          current_stage: number
          stages: any[]
          created_at?: string
          updated_at?: string
          notes: string
        }
        Update: {
          id?: string
          user_id?: string
          idea_id?: string
          current_stage?: number
          stages?: any[]
          created_at?: string
          updated_at?: string
          notes?: string
        }
      }
      repeated_tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          frequency: 'daily' | 'weekly' | 'monthly'
          is_active: boolean
          last_completed: string | null
          streak: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          frequency: 'daily' | 'weekly' | 'monthly'
          is_active: boolean
          last_completed?: string | null
          streak: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          frequency?: 'daily' | 'weekly' | 'monthly'
          is_active?: boolean
          last_completed?: string | null
          streak?: number
          created_at?: string
        }
      }
      non_repeated_tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          deadline: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'in-progress' | 'completed' | 'overdue'
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          deadline: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'in-progress' | 'completed' | 'overdue'
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          deadline?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in-progress' | 'completed' | 'overdue'
          created_at?: string
          completed_at?: string | null
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