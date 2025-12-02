export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          title: string;
          description: string | null;
          favicon: string | null;
          thumbnail: string | null;
          collection_id: string;
          is_deleted: boolean | null;
          deleted_at: string | null;
          created_at: string;
          last_modified_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          title: string;
          description?: string | null;
          favicon?: string | null;
          thumbnail?: string | null;
          collection_id: string;
          is_deleted?: boolean | null;
          deleted_at?: string | null;
          created_at?: string;
          last_modified_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          title?: string;
          description?: string | null;
          favicon?: string | null;
          thumbnail?: string | null;
          collection_id?: string;
          is_deleted?: boolean | null;
          deleted_at?: string | null;
          created_at?: string;
          last_modified_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          parent_id: string | null;
          order: number;
          is_deleted: boolean | null;
          deleted_at: string | null;
          created_at: string;
          last_modified_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          order?: number;
          is_deleted?: boolean | null;
          deleted_at?: string | null;
          created_at?: string;
          last_modified_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          order?: number;
          is_deleted?: boolean | null;
          deleted_at?: string | null;
          created_at?: string;
          last_modified_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
