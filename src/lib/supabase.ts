import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Use the pre-configured Supabase client and mark as configured
export const supabase = supabaseClient as any;
export const isSupabaseConfigured = true;
export type Database = {
  public: {
    Tables: {
      outfits: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          image_url: string;
          style_tags: string[] | null;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          image_url: string;
          style_tags?: string[] | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          image_url?: string;
          style_tags?: string[] | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          bio: string | null;
          followers_count: number;
          following_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          bio?: string | null;
          followers_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          followers_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      outfit_likes: {
        Row: {
          id: string;
          user_id: string;
          outfit_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          outfit_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          outfit_id?: string;
          created_at?: string;
        };
      };
    };
  };
};