import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          age: number | null;
          gender: string | null;
          bio: string | null;
          photo_url: string | null;
          status: string;
          profile_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          age?: number | null;
          gender?: string | null;
          bio?: string | null;
          photo_url?: string | null;
          status?: string;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          age?: number | null;
          gender?: string | null;
          bio?: string | null;
          photo_url?: string | null;
          status?: string;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      reactions: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          action: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          action: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          action?: string;
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          created_at?: string;
        };
      };
    };
  };
};
