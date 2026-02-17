export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      apps: {
        Row: {
          id: string;
          submission_type: "test" | "live";
          platform: "android" | "ios" | null;
          name: string;
          play_url: string | null;
          test_url: string | null;
          description: string | null;
          icon_url: string | null;
          start_date: string | null;
          end_date: string | null;
          status: "pending" | "approved" | "rejected";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_type?: "test" | "live";
          platform?: "android" | "ios" | null;
          name: string;
          play_url?: string | null;
          test_url?: string | null;
          description?: string | null;
          icon_url?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_type?: "test" | "live";
          platform?: "android" | "ios" | null;
          name?: string;
          play_url?: string | null;
          test_url?: string | null;
          description?: string | null;
          icon_url?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_by?: string;
          created_at?: string;
        };
      };
      admin_users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          password_hash: string;
          role: "admin" | "super_admin";
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          password_hash: string;
          role?: "admin" | "super_admin";
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string;
          password_hash?: string;
          role?: "admin" | "super_admin";
          created_at?: string;
          created_by?: string;
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
      app_status: "pending" | "approved" | "rejected";
      admin_role: "admin" | "super_admin";
    };
  };
}

export type App = Database["public"]["Tables"]["apps"]["Row"];
export type AppInsert = Database["public"]["Tables"]["apps"]["Insert"];
export type AppUpdate = Database["public"]["Tables"]["apps"]["Update"];

export type AdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
export type AdminUserInsert = Database["public"]["Tables"]["admin_users"]["Insert"];
export type AdminUserUpdate = Database["public"]["Tables"]["admin_users"]["Update"];
