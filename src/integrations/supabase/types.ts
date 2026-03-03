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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      episodes: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          episode_number: number
          id: string
          season_id: string
          series_id: string
          thumbnail_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          episode_number: number
          id?: string
          season_id: string
          series_id: string
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          episode_number?: number
          id?: string
          season_id?: string
          series_id?: string
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      movie_ratings: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          rating?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      movies: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          duration: string | null
          genre: string | null
          id: string
          is_featured: boolean | null
          poster_url: string | null
          rating: number | null
          release_year: number | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          is_featured?: boolean | null
          poster_url?: string | null
          rating?: number | null
          release_year?: number | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          is_featured?: boolean | null
          poster_url?: string | null
          rating?: number | null
          release_year?: number | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          message?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_online: boolean
          last_seen: string | null
          unique_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_online?: boolean
          last_seen?: string | null
          unique_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_online?: boolean
          last_seen?: string | null
          unique_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          id: string
          season_number: number
          series_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          season_number: number
          series_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          season_number?: number
          series_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          genre: string | null
          id: string
          is_featured: boolean | null
          poster_url: string | null
          rating: number | null
          release_year: number | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          is_featured?: boolean | null
          poster_url?: string | null
          rating?: number | null
          release_year?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          is_featured?: boolean | null
          poster_url?: string | null
          rating?: number | null
          release_year?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      watch_parties: {
        Row: {
          created_at: string
          current_time_sec: number
          friend_id: string
          host_id: string
          id: string
          is_playing: boolean
          movie_id: string
          status: string
        }
        Insert: {
          created_at?: string
          current_time_sec?: number
          friend_id: string
          host_id: string
          id?: string
          is_playing?: boolean
          movie_id: string
          status?: string
        }
        Update: {
          created_at?: string
          current_time_sec?: number
          friend_id?: string
          host_id?: string
          id?: string
          is_playing?: boolean
          movie_id?: string
          status?: string
        }
        Relationships: []
      }
      watch_party_history: {
        Row: {
          duration_watched_sec: number
          ended_at: string | null
          friend_id: string
          host_id: string
          id: string
          movie_id: string
          started_at: string
        }
        Insert: {
          duration_watched_sec?: number
          ended_at?: string | null
          friend_id: string
          host_id: string
          id?: string
          movie_id: string
          started_at?: string
        }
        Update: {
          duration_watched_sec?: number
          ended_at?: string | null
          friend_id?: string
          host_id?: string
          id?: string
          movie_id?: string
          started_at?: string
        }
        Relationships: []
      }
      watch_progress: {
        Row: {
          current_time_sec: number
          duration_sec: number
          id: string
          last_watched: string
          movie_id: string
          user_id: string
        }
        Insert: {
          current_time_sec?: number
          duration_sec?: number
          id?: string
          last_watched?: string
          movie_id: string
          user_id: string
        }
        Update: {
          current_time_sec?: number
          duration_sec?: number
          id?: string
          last_watched?: string
          movie_id?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          user_id?: string
        }
        Relationships: []
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
