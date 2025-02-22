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
      voucher_requests: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          amount: number
          head_of_account: string
          status: 'pending' | 'approved' | 'rejected'
          description: string | null
          user_id: string
          approver_id: string | null
          rejection_reason: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          amount: number
          head_of_account: string
          status?: 'pending' | 'approved' | 'rejected'
          description?: string | null
          user_id: string
          approver_id?: string | null
          rejection_reason?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          amount?: number
          head_of_account?: string
          status?: 'pending' | 'approved' | 'rejected'
          description?: string | null
          user_id?: string
          approver_id?: string | null
          rejection_reason?: string | null
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
