export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          slug: string;
          name: string;
          address_line: string;
          city: string;
          state: string;
          postal_code: string | null;
          lat: number | null;
          lng: number | null;
          geocode_status: "pending" | "success" | "failed";
          category: string | null;
          distribution_day: string | null;
          next_distribution_dates: string[];
          distribution_time_text: string | null;
          availability_status: string | null;
          enrollment_frequency: string | null;
          enrollment_time_text: string | null;
          additional_languages: string[];
          additional_info: string[];
          zip_codes_served: string[];
          outside_zip_code: boolean;
          source_url: string | null;
          site_url: string | null;
          active: boolean;
          last_scraped_at: string | null;
          last_changed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          slug: string;
          name: string;
          address_line: string;
          city?: string;
          state?: string;
          postal_code?: string | null;
          lat?: number | null;
          lng?: number | null;
          geocode_status?: "pending" | "success" | "failed";
          category?: string | null;
          distribution_day?: string | null;
          next_distribution_dates?: string[];
          distribution_time_text?: string | null;
          availability_status?: string | null;
          enrollment_frequency?: string | null;
          enrollment_time_text?: string | null;
          additional_languages?: string[];
          additional_info?: string[];
          zip_codes_served?: string[];
          outside_zip_code?: boolean;
          source_url?: string | null;
          site_url?: string | null;
          active?: boolean;
          last_scraped_at?: string | null;
          last_changed_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          slug?: string;
          name?: string;
          address_line?: string;
          city?: string;
          state?: string;
          postal_code?: string | null;
          lat?: number | null;
          lng?: number | null;
          geocode_status?: "pending" | "success" | "failed";
          category?: string | null;
          distribution_day?: string | null;
          next_distribution_dates?: string[];
          distribution_time_text?: string | null;
          availability_status?: string | null;
          enrollment_frequency?: string | null;
          enrollment_time_text?: string | null;
          additional_languages?: string[];
          additional_info?: string[];
          zip_codes_served?: string[];
          outside_zip_code?: boolean;
          source_url?: string | null;
          site_url?: string | null;
          active?: boolean;
          last_scraped_at?: string | null;
          last_changed_at?: string | null;
        };
        Relationships: [];
      };
      location_snapshots: {
        Row: {
          id: string;
          location_id: string;
          scraped_at: string;
          snapshot_hash: string;
          payload_json: Json;
        };
        Insert: {
          id?: string;
          location_id: string;
          scraped_at?: string;
          snapshot_hash: string;
          payload_json: Json;
        };
        Update: {
          id?: string;
          location_id?: string;
          scraped_at?: string;
          snapshot_hash?: string;
          payload_json?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "location_snapshots_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
